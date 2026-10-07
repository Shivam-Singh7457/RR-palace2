import { pingAIService } from "../utils/aiKeepAlive.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export const chatWithAI = async (req, res) => {
  try {
    const { messages, session_id, temperature, max_tokens, user } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Messages array cannot be empty."
      });
    }

    const userPayload = user || (req.user ? { id: req.user._id, email: req.user.email, username: req.user.username } : null);

    // Forward to Python AI service with retry support for cold-starts / loading states
    let response = null;
    let lastError = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s timeout per attempt for Render cold-starts

        response = await fetch(`${AI_SERVICE_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages,
            session_id,
            temperature,
            max_tokens,
            user: userPayload
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return res.status(200).json(data);
        } else {
          lastError = new Error(`AI service returned HTTP ${response.status}`);
        }
      } catch (err) {
        lastError = err;
        console.warn(`[AI Proxy] Attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      }

      if (attempt < maxAttempts) {
        pingAIService(1, 3000, 45000).catch(() => {});
        await new Promise((res) => setTimeout(res, 2500));
      }
    }

    throw lastError || new Error("AI service unavailable after retries");
  } catch (error) {
    console.error("🔴 AI Service Proxy Error:", error.message);
    // Trigger background ping/wakeup attempt
    pingAIService(2, 3000, 45000).catch(() => {});

    // Return HTTP 503 so client knows AI service is waking up and can auto-retry
    return res.status(503).json({
      success: false,
      waking_up: true,
      message: "Vedika AI is starting up... Please wait a few seconds and try again."
    });
  }
};

export const checkAIHealth = async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for health check during cold start
    const response = await fetch(`${AI_SERVICE_URL}/health`, { method: "GET", signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ success: true, ai_service: "online", details: data });
    } else {
      pingAIService(2, 3000, 45000).catch(() => {});
      return res.status(503).json({ success: false, ai_service: "offline", status: response.status });
    }
  } catch (error) {
    pingAIService(2, 3000, 45000).catch(() => {});
    return res.status(503).json({ success: false, ai_service: "waking_up", error: error.message });
  }
};

export const streamChatWithAI = async (req, res) => {
  try {
    const { messages, session_id, temperature, max_tokens, user } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const userPayload = user || (req.user ? { id: req.user._id, email: req.user.email, username: req.user.username } : null);

    const pyRes = await fetch(`${AI_SERVICE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, session_id, temperature, max_tokens, user: userPayload })
    });

    if (!pyRes.ok) {
      pingAIService(2, 3000, 45000).catch(() => {});
      res.write(`data: ${JSON.stringify({ error: "AI service error" })}\n\n`);
      return res.end();
    }

    const reader = pyRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value));
    }
    res.end();
  } catch (error) {
    console.error("🔴 AI Stream Proxy Error:", error.message);
    pingAIService(2, 3000, 45000).catch(() => {});
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

