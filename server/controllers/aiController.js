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

    // Forward to Python AI service using native fetch
    const response = await fetch(`${AI_SERVICE_URL}/chat`, {
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
      })
    });

    if (!response.ok) {
      throw new Error(`AI service HTTP ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("🔴 AI Service Proxy Error:", error.message);

    // Graceful fallback if AI service is offline
    return res.status(200).json({
      success: true,
      message: {
        role: "assistant",
        content: "Hi, I am Vedika! Welcome to Royal Rudraksh Palace. Our reservation service is currently undergoing brief maintenance. Please contact our front desk directly for immediate assistance."
      },
      model: "fallback-concierge"
    });
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
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};
