const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const IP = '192.168.18.49';
const PORT = 6000;
const API_URL = `http://${IP}:${PORT}`;

const ROOT_DIR = __dirname;
const ENV_PATH = path.join(ROOT_DIR, '.env');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

function npmCmd() {
    return process.platform === "win32" ? "npm.cmd" : "npm";
}

// 1. Update .env
console.log(`\n📝 Updating .env with API_URL=${API_URL}`);
try {
    let content = '';
    if (fs.existsSync(ENV_PATH)) {
        content = fs.readFileSync(ENV_PATH, 'utf8');
    }

    // Replace or append API_URL
    if (content.includes('API_URL=')) {
        content = content.replace(/API_URL=.*(\r?\n|$)/, `API_URL=${API_URL}\n`);
    } else {
        content += `\nAPI_URL=${API_URL}\n`;
    }

    fs.writeFileSync(ENV_PATH, content);
    console.log('✅ .env updated');
} catch (error) {
    console.error('❌ Failed to update .env:', error.message);
}

// 2. Start Backend
console.log(`\n🚀 Starting Backend on port ${PORT}...`);
const backend = spawn(npmCmd(), ['run', 'dev'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: String(PORT) }
});

// 3. Start Expo
console.log('\n📱 Starting Expo...');
const expo = spawn(npmCmd(), ['start', '--', '-c'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: true
});

// Cleanup on exit
const cleanup = () => {
    console.log('\n🛑 Shutting down...');
    backend.kill();
    expo.kill();
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
