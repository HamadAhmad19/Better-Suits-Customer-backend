const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, "backend");
const ROOT_ENV_PATH = path.join(ROOT_DIR, ".env");
const BACKEND_ENV_PATH = path.join(BACKEND_DIR, ".env");
const NGROK_BIN =
  process.platform === "win32"
    ? path.join(BACKEND_DIR, "ngrok.exe")
    : path.join(BACKEND_DIR, "ngrok");

function readBackendPort() {
  try {
    const env = fs.readFileSync(BACKEND_ENV_PATH, "utf8");
    const m = env.match(/^\s*PORT\s*=\s*(\d+)\s*$/m);
    if (m) return Number(m[1]);
  } catch (_) {}
  return 6000;
}

function upsertRootApiUrl(url) {
  const line = `API_URL=${url}`;
  let content = "";
  try {
    content = fs.readFileSync(ROOT_ENV_PATH, "utf8");
  } catch (_) {}
  if (/^\s*API_URL\s*=/m.test(content)) {
    content = content.replace(/^\s*API_URL\s*=.*$/m, line);
  } else {
    content = (content.trimEnd() + "\n" + line + "\n").replace(/^\n/, "");
  }
  fs.writeFileSync(ROOT_ENV_PATH, content, "utf8");
}

function spawnLogged(cmd, args, opts) {
  const child = spawn(cmd, args, { stdio: "pipe", shell: true, ...opts });
  child.stdout.on("data", (d) => process.stdout.write(d));
  child.stderr.on("data", (d) => process.stderr.write(d));
  return child;
}

function npmCmd() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

async function main() {
  const port = readBackendPort();
  console.log(`\n🧩 Starting DEV stack`);
  console.log(`   • Backend port: ${port}`);
  console.log(`   • Backend dir:  ${BACKEND_DIR}`);
  console.log("");

  const backend = spawnLogged(npmCmd(), ["run", "dev"], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: String(port) },
  });
  console.log("\n🌐 Starting ngrok tunnel...");
  const ngrokArgs = ["http", String(port), "--log", "stdout"];
  const ngrok = spawn(NGROK_BIN, ngrokArgs, {
    cwd: BACKEND_DIR,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let gotUrl = false;
  const tryExtract = (chunk) => {
    const out = chunk.toString();
    const m = out.match(/url=(https:\/\/[^\s]+)/);
    if (m && !gotUrl) {
      gotUrl = true;
      const publicUrl = m[1].trim();
      upsertRootApiUrl(publicUrl);
      console.log(`\n✅ Updated root .env -> API_URL=${publicUrl}\n`);
      console.log("🚀 Starting Expo (Go Live)...");
      const expo = spawn(npmCmd(), ["start"], {
        cwd: ROOT_DIR,
        stdio: "inherit",
        shell: true,
      });

      const shutdown = () => {
        console.log("\n🛑 Shutting down...");
        try {
          expo.kill("SIGINT");
        } catch (_) {}
        try {
          ngrok.kill("SIGINT");
        } catch (_) {}
        try {
          backend.kill("SIGINT");
        } catch (_) {}
        process.exit(0);
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    }
  };

  ngrok.stdout.on("data", tryExtract);
  ngrok.stderr.on("data", (d) => process.stderr.write(d));

  ngrok.on("close", (code) => {
    if (!gotUrl) {
      console.error(
        `\n❌ ngrok exited (code ${code}) before providing a public URL.`
      );
      console.error("   Common fixes:");
      console.error(
        "   • Run once: backend\\ngrok.exe config add-authtoken YOUR_TOKEN"
      );
      console.error(
        "   • Ensure your backend is running and PORT matches backend/.env"
      );
    }
    process.exit(code || 1);
  });
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
