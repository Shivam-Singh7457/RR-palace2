import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let aiProcess = null;
let isStarting = false;

/**
 * Resolves the path to the Python executable within ai-service venv or system.
 */
function getPythonExecutable(aiServiceDir) {
  // 1. Virtual Environment executables
  const venvWin = path.join(aiServiceDir, "venv", "Scripts", "python.exe");
  const venvUnix = path.join(aiServiceDir, "venv", "bin", "python");

  if (fs.existsSync(venvWin)) return venvWin;
  if (fs.existsSync(venvUnix)) return venvUnix;

  // 2. System python fallbacks
  return "python";
}

/**
 * Ensures the Python FastAPI AI service is active.
 * If local (localhost / 127.0.0.1) and offline, auto-spawns the Python uvicorn server.
 */
export async function ensureAIServiceRunning() {
  const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

  // Only auto-spawn if AI service target is local
  const isLocal = aiServiceUrl.includes("localhost") || aiServiceUrl.includes("127.0.0.1");
  if (!isLocal) {
    return true;
  }

  // Quick health check to see if already running
  try {
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 2000);
    const healthRes = await fetch(`${aiServiceUrl}/health`, { signal: controller.signal });
    clearTimeout(tId);
    if (healthRes.ok) {
      console.log(`[AI Launcher] ✅ AI Service is already running at ${aiServiceUrl}`);
      return true;
    }
  } catch (err) {
    // Service offline, proceed to auto-spawn
  }

  if (isStarting) {
    console.log("[AI Launcher] AI Service start in progress...");
    return false;
  }

  isStarting = true;
  console.log(`[AI Launcher] 🚀 AI Service not detected at ${aiServiceUrl}. Auto-starting Python AI microservice...`);

  try {
    // Locate ai-service directory relative to server directory
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const aiServiceDir = path.resolve(__dirname, "../../ai-service");

    if (!fs.existsSync(aiServiceDir)) {
      console.error(`[AI Launcher] ❌ Could not locate ai-service directory at ${aiServiceDir}`);
      isStarting = false;
      return false;
    }

    const pythonBin = getPythonExecutable(aiServiceDir);
    console.log(`[AI Launcher] Using Python binary: ${pythonBin}`);

    // Parse host & port from AI_SERVICE_URL
    let port = "8000";
    try {
      const parsedUrl = new URL(aiServiceUrl);
      if (parsedUrl.port) port = parsedUrl.port;
    } catch (_) {}

    aiProcess = spawn(pythonBin, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", port, "--reload"], {
      cwd: aiServiceDir,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
      shell: true
    });

    aiProcess.stdout.on("data", (data) => {
      const str = data.toString().trim();
      if (str) console.log(`[Python AI] ${str}`);
    });

    aiProcess.stderr.on("data", (data) => {
      const str = data.toString().trim();
      if (str) console.log(`[Python AI] ${str}`);
    });

    aiProcess.on("exit", (code, signal) => {
      console.warn(`[AI Launcher] Python AI Service process exited with code ${code}, signal ${signal}`);
      aiProcess = null;
      isStarting = false;
    });

    // Clean up process on Node exit
    const cleanup = () => {
      if (aiProcess) {
        console.log("[AI Launcher] Shutting down spawned Python AI Service...");
        try {
          if (process.platform === "win32") {
            execSync(`taskkill /pid ${aiProcess.pid} /T /F`);
          } else {
            aiProcess.kill("SIGTERM");
          }
        } catch (_) {}
        aiProcess = null;
      }
    };

    process.once("exit", cleanup);
    process.once("SIGINT", cleanup);
    process.once("SIGTERM", cleanup);

    // Poll up to 15 seconds for startup complete
    const startTime = Date.now();
    while (Date.now() - startTime < 15000) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 1500);
        const check = await fetch(`${aiServiceUrl}/health`, { signal: c.signal });
        clearTimeout(t);
        if (check.ok) {
          console.log(`[AI Launcher] 🎉 Python AI Service started successfully on ${aiServiceUrl}!`);
          isStarting = false;
          return true;
        }
      } catch (_) {}
    }

    console.warn("[AI Launcher] AI Service took longer than expected to report healthy, but background process was launched.");
    isStarting = false;
    return true;
  } catch (err) {
    console.error("[AI Launcher] Failed to auto-start Python AI service:", err.message);
    isStarting = false;
    return false;
  }
}
