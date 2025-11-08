const mineflayer = require('mineflayer');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 🌍 Minecraft Bot Configuration
const config = {
  host: 'Anasvirat18.aternos.me', // your Aternos server host
  port: 35369,
  version: '1.21.5'
};

let bot;
let reconnectTimeout = null;
let botStatus = {
  connected: false,
  lastConnected: null,
  lastError: null
};

// ✨ Helper: random unique username
function randomUsername() {
  const id = Math.floor(Math.random() * 10000);
  return `AutoBot_${id}`;
}

// 🧠 Start Bot (after service is live)
function startBot() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  const username = randomUsername();
  console.log(`🤖 Launching Minecraft bot as ${username}...`);

  bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: username,
    version: config.version
  });

  bot.once('spawn', () => {
    botStatus.connected = true;
    botStatus.lastConnected = new Date().toLocaleString();
    console.log(`✅ Bot connected successfully (${bot.version})`);
  });

  // Controlled reconnects
  function scheduleReconnect(delay = 90000) {
    if (reconnectTimeout) return;
    console.log(`🔁 Reconnecting in ${delay / 1000}s...`);
    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      startBot();
    }, delay);
  }

  bot.on('end', () => {
    console.log('🔌 Bot disconnected.');
    botStatus.connected = false;
    scheduleReconnect();
  });

  bot.on('kicked', (reason) => {
    console.log('🚪 Kicked:', reason);
    botStatus.connected = false;
    scheduleReconnect(90000);
  });

  bot.on('error', (err) => {
    console.log('⚠️ Error:', err.message);
    botStatus.connected = false;
    botStatus.lastError = err.message;
    scheduleReconnect(120000);
  });
}

// 🌐 Express dashboard
app.use(express.static(path.join(__dirname, 'public')));

app.get('/status', (req, res) => {
  res.json({
    connected: botStatus.connected,
    host: config.host,
    port: config.port,
    version: config.version,
    lastConnected: botStatus.lastConnected,
    lastError: botStatus.lastError
  });
});

// 🟢 Step 1: Start web service first (so Render marks it as “live”)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌍 Web dashboard is live on port ${PORT}`);

  // 🟢 Step 2: Wait a few seconds to ensure service is stable, then join Minecraft
  console.log('⏳ Waiting for Render service to stabilize...');
  setTimeout(() => {
    console.log('🚀 Service is live — connecting Minecraft bot...');
    startBot();
  }, 15000); // wait 15 seconds before joining
});
