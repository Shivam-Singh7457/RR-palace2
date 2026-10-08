import cron from "node-cron";
import { ensureAIServiceRunning } from "./aiLauncher.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
let lastPingTimestamp = 0;
let lastRestartHookTrigger = 0;
let isAIServiceHealthy = false;
let isPingInProgress = false;

const PING_THROTTLE_MS = 2 * 60 * 1000; // 2 minutes throttle between request-driven pings if healthy
const RESTART_COOLDOWN_MS = 5 * 60 * 1000; // 5 minute cooldown between restart webhooks

/**
 * Pings the Python AI Service /health endpoint to keep it awake & warm.
 * Retries up to maxRetries if the service is cold starting with 45s timeout for Render/free-tier cold starts.
 */
export const pingAIService = async (maxRetries = 2, retryIntervalMs = 4000, timeoutMs = 45000) => {
  if (isPingInProgress) return isAIServiceHealthy;
  isPingInProgress = true;
  lastPingTimestamp = Date.now();

  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        console.log(`[AI Keep-Alive] Pinging AI service at ${AI_SERVICE_URL}/health (attempt ${attempt}/${maxRetries})...`);
        const response = await fetch(`${AI_SERVICE_URL}/health`, {
          method: "GET",
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log(`[AI Keep-Alive] ✅ AI Service is online (${data.service || "active"}).`);
          isAIServiceHealthy = true;
          return true;
        } else {
          console.warn(`[AI Keep-Alive] Attempt ${attempt}/${maxRetries}: AI Service returned HTTP ${response.status}.`);
        }
      } catch (error) {
        console.warn(`[AI Keep-Alive] Attempt ${attempt}/${maxRetries}: Ping failed (${error.message}).`);
      }

      // If local and failed, attempt auto-starting Python process
      if (AI_SERVICE_URL.includes("localhost") || AI_SERVICE_URL.includes("127.0.0.1")) {
        await ensureAIServiceRunning().catch(() => {});
      }

      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, retryIntervalMs));
      }
    }

    isAIServiceHealthy = false;
    // If all attempts fail, trigger restart hook if configured and not on cooldown
    await triggerAIRestartWebhook();
    return false;
  } finally {
    isPingInProgress = false;
  }
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
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    await fetch(restartHook, { method: "POST", signal: controller.signal });
    clearTimeout(timeoutId);
    console.log("[AI Keep-Alive] AI Service restart hook triggered successfully.");
  } catch (err) {
    console.error("[AI Keep-Alive] Failed to call restart hook:", err.message);
  }
};

/**
 * Express Middleware: Automatically triggers an asynchronous ping/wake-up for the AI service
 * whenever ANY backend route is called in the system.
 */
export const aiWakeupMiddleware = (req, res, next) => {
  const now = Date.now();
  // If AI service is marked unhealthy OR it's been more than PING_THROTTLE_MS since last ping, ping now in background
  if (!isAIServiceHealthy || (now - lastPingTimestamp > PING_THROTTLE_MS)) {
    pingAIService(1, 3000, 45000).catch((err) => {
      console.warn("[AI Keep-Alive] Request-driven wake-up ping failed:", err.message);
    });
  }
  next();
};

/**
 * Initializes the automated ping & warm-up task for the AI service.
 * - Runs a multi-attempt wake-up loop asynchronously at backend startup.
 * - Auto-spawns local Python AI service process if offline.
 * - Runs recurring ping every 10 minutes to maintain keep-alive.
 */
export const initAIKeepAlive = async () => {
  console.log("[AI Keep-Alive] Initializing AI service warm-up, auto-start, and ping schedule...");

  // 1. If local, ensure local Python AI service is launched immediately
  if (AI_SERVICE_URL.includes("localhost") || AI_SERVICE_URL.includes("127.0.0.1")) {
    await ensureAIServiceRunning().catch((err) => {
      console.error("[AI Keep-Alive] Auto-start check failed:", err.message);
    });
  }

  // 2. Asynchronously wake up / warm up AI Service with retries at startup
  pingAIService(3, 4000, 45000).catch((err) => {
    console.error("[AI Keep-Alive] Startup wake-up failed:", err.message);
  });

  // 3. Schedule recurring ping every 10 minutes to maintain keep-alive
  cron.schedule("*/10 * * * *", () => {
    pingAIService(1, 3000, 30000).catch(() => {});
  });
};



