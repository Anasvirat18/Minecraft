const mineflayer = require('mineflayer');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 🌍 Minecraft Config (change host/port to your Aternos server)
const config = {
  host: 'Anasvirat18.aternos.me',
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

// ✨ Helper to create a unique username each session
function randomUsername() {
  const id = Math.floor(Math.random() * 10000);
  return `AutoBot_${id}`;
}

// 🧠 Start bot
function startBot() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  const username = randomUsername();
  console.log(`🚀 Starting Minecraft bot as ${username}...`);

  bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: username,
    version: config.version
  });

  bot.once('spawn', () => {
    botStatus.connected = true;
    botStatus.lastConnected = new Date().toLocaleString();
    console.log(`✅ Bot connected successfully (Minecraft ${bot.version})`);
  });

  // 🔁 Controlled reconnects
  function scheduleReconnect(delay = 90000) { // 90 s
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
    scheduleReconnect(90000); // wait 90 s to avoid throttle
  });

  bot.on('error', (err) => {
    console.log('⚠️ Error:', err.message);
    botStatus.connected = false;
    botStatus.lastError = err.message;
    scheduleReconnect(120000); // 2 min delay for connection errors
  });
}

// 🚀 Launch
startBot();

// 🌐 Web dashboard
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌍 Web dashboard running on port ${PORT}`);
});
