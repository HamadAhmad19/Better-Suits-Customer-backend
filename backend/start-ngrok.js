require('dotenv').config(); // Load environment variables
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ROOT_ENV_PATH = path.join(__dirname, '..', '.env');
function upsertRootApiUrl(url) {
    const line = `API_URL=${url}`;
    let content = '';
    try { content = fs.readFileSync(ROOT_ENV_PATH, 'utf8'); } catch (_) {}
    if (/^\s*API_URL\s*=/m.test(content)) {
        content = content.replace(/^\s*API_URL\s*=.*$/m, line);
    } else {
        content = (content.trimEnd() + '\n' + line + '\n').replace(/^\n/, '');
    }
    fs.writeFileSync(ROOT_ENV_PATH, content, 'utf8');
}

// Configuration
const BACKEND_PORT = process.env.PORT || 5000;
const NGROK_PATH = path.join(__dirname, 'ngrok.exe');

console.log('🚀 Starting ngrok tunnel...');
console.log(`📍 Backend running on port: ${BACKEND_PORT}`);
console.log('');

// Start ngrok
const ngrok = spawn(NGROK_PATH, ['http', BACKEND_PORT.toString(), '--log', 'stdout']);

let isFirstUrl = true;

ngrok.stdout.on('data', (data) => {
    const output = data.toString();

    // Look for the public URL in the output
    const urlMatch = output.match(/url=(https:\/\/[^\s]+)/);
    if (urlMatch && isFirstUrl) {
        const publicUrl = urlMatch[1];
        isFirstUrl = false;
        // Auto-update root .env so you don't need to copy/paste
        try { upsertRootApiUrl(publicUrl); } catch (e) { console.error('Failed to write root .env:', e); }


        console.log('');
        console.log('╔════════════════════════════════════════════════════════════════╗');
        console.log('║                   🎉 NGROK TUNNEL ACTIVE 🎉                    ║');
        console.log('╠════════════════════════════════════════════════════════════════╣');
        console.log(`║  Public URL: ${publicUrl.padEnd(45)} ║`);
        console.log('╠════════════════════════════════════════════════════════════════╣');
        console.log('║  ✅ Auto-updated your root .env with this URL                 ║');
        console.log('║                                                                ║');
        console.log('║  1. Open: C:\\Users\\hp\\Downloads\\myRideApp\\.env                  ║');
        console.log(`║  2. API_URL set to: ${publicUrl.padEnd(37)} ║`);
        console.log('║  3. If Expo is already running, reload the app (press r)      ║');
        console.log('║                                                                ║');
        console.log('║  Then your app will work on ANY network! 🌐                   ║');
        console.log('╚════════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log('💡 Tip: Keep this window open while developing');
        console.log('⚠️  Note: This URL changes each time you restart ngrok');
        console.log('');
        console.log('📊 Ngrok logs:');
        console.log('─────────────────────────────────────────────────────────────────');
    }

    // Show other ngrok output
    if (!output.includes('lvl=info')) {
        process.stdout.write(output);
    }
});

ngrok.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
});

ngrok.on('close', (code) => {
    console.log('');
    console.log(`🛑 Ngrok tunnel closed with code ${code}`);
    process.exit(code);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('');
    console.log('🛑 Stopping ngrok tunnel...');
    ngrok.kill();
    process.exit(0);
});

console.log('⏳ Waiting for ngrok to connect...');
