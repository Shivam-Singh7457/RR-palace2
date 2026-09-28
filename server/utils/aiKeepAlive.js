import cron from "node-cron";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Pings the Python AI Service /health endpoint to keep it awake & warm.
 * If the service is sleeping (e.g., Render/Railway free tier), this ping wakes it up.
 */
export const pingAIService = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log(`[AI Keep-Alive] AI Service is online (${data.service || "active"}).`);
    } else {
      console.warn(`[AI Keep-Alive] AI Service returned status HTTP ${response.status}.`);
      await triggerAIRestartWebhook();
    }
  } catch (error) {
    console.warn(`[AI Keep-Alive] AI Service ping warning (${error.message}). Attempting restart trigger if configured...`);
    await triggerAIRestartWebhook();
  }
};

/**
 * Triggers a deployment/restart webhook if configured (e.g. Render Deploy Hook URL).
 */
const triggerAIRestartWebhook = async () => {
  const restartHook = process.env.AI_SERVICE_RESTART_HOOK;
  if (!restartHook) return;

  try {
    console.log("[AI Keep-Alive] Triggering AI Service Restart Hook...");
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
 * - Runs immediately when the website backend starts up.
 * - Runs every 5 minutes to prevent free-tier inactivity timeouts.
 */
export const initAIKeepAlive = () => {
  console.log("[AI Keep-Alive] Initializing AI service warm-up and ping schedule...");

  // 1. Immediately wake up / warm up AI Service when backend starts
  pingAIService();

  // 2. Schedule recurring ping every 10 minutes to prevent idle sleeping (Render sleeps after 15m)
  cron.schedule("*/10 * * * *", () => {
    pingAIService();
  });
};
