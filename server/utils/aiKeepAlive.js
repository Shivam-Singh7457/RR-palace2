import cron from "node-cron";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
let lastRestartHookTrigger = 0;
const RESTART_COOLDOWN_MS = 5 * 60 * 1000; // 5 minute cooldown between restart webhooks

/**
 * Pings the Python AI Service /health endpoint to keep it awake & warm.
 * Retries up to maxRetries if the service is cold starting.
 */
export const pingAIService = async (maxRetries = 1, retryIntervalMs = 4000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for cold start

      const response = await fetch(`${AI_SERVICE_URL}/health`, {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`[AI Keep-Alive] ✅ AI Service is online (${data.service || "active"}).`);
        return true;
      } else {
        console.warn(`[AI Keep-Alive] Attempt ${attempt}/${maxRetries}: AI Service returned HTTP ${response.status}.`);
      }
    } catch (error) {
      console.warn(`[AI Keep-Alive] Attempt ${attempt}/${maxRetries}: Ping failed (${error.message}).`);
    }

    if (attempt < maxRetries) {
      await new Promise((res) => setTimeout(res, retryIntervalMs));
    }
  }

  // If all attempts fail, trigger restart hook if configured and not on cooldown
  await triggerAIRestartWebhook();
  return false;
};

/**
 * Triggers a deployment/restart webhook if configured (e.g. Render Deploy Hook URL).
 */
const triggerAIRestartWebhook = async () => {
  const restartHook = process.env.AI_SERVICE_RESTART_HOOK;
  if (!restartHook) return;

  const now = Date.now();
  if (now - lastRestartHookTrigger < RESTART_COOLDOWN_MS) {
    console.log("[AI Keep-Alive] Restart hook skipped (cooldown active).");
    return;
  }

  try {
    lastRestartHookTrigger = now;
    console.log("[AI Keep-Alive] 🚀 Triggering AI Service Restart Hook...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    await fetch(restartHook, { method: "POST", signal: controller.signal });
    clearTimeout(timeoutId);
    console.log("[AI Keep-Alive] AI Service restart hook triggered successfully.");
  } catch (err) {
    console.error("[AI Keep-Alive] Failed to call restart hook:", err.message);
  }
};

/**
 * Initializes the automated ping & warm-up task for the AI service.
 * - Runs a multi-attempt wake-up loop asynchronously at backend startup.
 * - Runs recurring ping every 10 minutes to prevent Render/Railway free tier sleeping.
 */
export const initAIKeepAlive = () => {
  console.log("[AI Keep-Alive] Initializing AI service warm-up and ping schedule...");

  // 1. Asynchronously wake up / warm up AI Service with retries (won't block server startup)
  pingAIService(6, 5000).catch((err) => {
    console.error("[AI Keep-Alive] Startup wake-up failed:", err.message);
  });

  // 2. Schedule recurring ping every 10 minutes
  cron.schedule("*/10 * * * *", () => {
    pingAIService(2, 3000).catch(() => {});
  });
};

