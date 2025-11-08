const mineflayer = require('mineflayer');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 🌍 Minecraft Server Configuration
const config = {
  host: 'Anasvirat18.aternos.me',
  port: 35369,
  version: '1.21.5',
  username: 'AutoBot_3483'
};

let bot;
let reconnectTimeout = null;
let botStatus = {
  connected: false,
  lastConnected: null,
  lastError: null
};

// Serve static files (for index.html)
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to show live status in dashboard
app.get('/status', (req, res) => {
  res.json({
    connected: botStatus.connected,
    server: `${config.host}:${config.port}`,
    version: config.version,
    username: config.username,
    lastConnected: botStatus.lastConnected,
    lastError: botStatus.lastError
  });
});

// 🌍 Web Dashboard
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌍 Web dashboard running on port ${PORT}`);
  console.log('⏳ Waiting 15 seconds before connecting to Minecraft...');
  setTimeout(() => {
    console.log('🚀 Joining Minecraft server...');
    startBot();
  }, 15000);
});

// 🚀 Start Minecraft Bot
function startBot() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  console.log(`🤖 Launching Minecraft bot as ${config.username}...`);

  bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version
  });

  bot.once('spawn', () => {
    botStatus.connected = true;
    botStatus.lastConnected = new Date().toLocaleString();
    console.log(`✅ Bot connected successfully (Minecraft ${bot.version})`);
    startAFKTasks();
    setTimeout(checkForBed, 5000);
  });

  // 💀 Auto-respawn
  bot.on('death', () => {
    console.log('💀 Bot died! Respawning in 5 seconds...');
    setTimeout(() => {
      bot.respawn();
      console.log('🔄 Respawned!');
    }, 5000);
  });

  bot.on('end', () => handleDisconnect('Bot disconnected.'));
  bot.on('kicked', (reason) => handleDisconnect(`Kicked: ${reason}`));
  bot.on('error', (err) => handleDisconnect(`Error: ${err.message}`));

  bot.on('time', () => {
    const t = bot.time.timeOfDay % 24000;
    if (t > 12541 && t < 23460) checkForBed();
  });
}

function handleDisconnect(message) {
  console.log(`🔌 ${message}`);
  botStatus.connected = false;
  botStatus.lastError = message;
  scheduleReconnect(30000);
}

function scheduleReconnect(delay = 30000) {
  if (reconnectTimeout) return;
  console.log(`🔁 Reconnecting in ${delay / 1000}s...`);
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    startBot();
  }, delay);
}

// 🎮 Random movement, jump, break
function startAFKTasks() {
  setInterval(() => {
    if (!botStatus.connected) return;
    const moves = ['forward', 'back', 'left', 'right'];
    const move = moves[Math.floor(Math.random() * moves.length)];
    bot.setControlState(move, true);
    bot.look(Math.random() * Math.PI * 2, 0);
    setTimeout(() => bot.setControlState(move, false), 1000);

    if (Math.random() > 0.5) {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 300);
    }

    if (Math.random() > 0.7) breakBlockBelow();
  }, 5000);
}

async function breakBlockBelow() {
  const target = bot.blockAt(bot.entity.position.offset(0, -1, 0));
  if (!target || target.name.includes('bedrock')) return;
  try {
    await bot.dig(target);
    console.log(`⛏️ Broke block: ${target.name}`);
  } catch (err) {
    console.log(`❌ Can't break block: ${err.message}`);
  }
}

async function checkForBed() {
  if (!bot.entity || !bot.world) return;
  const bed = bot.findBlock({
    matching: block => block.name.includes('bed'),
    maxDistance: 6
  });
  if (!bed) {
    console.log('🛏️ No bed nearby to set spawn.');
    return;
  }
  try {
    console.log('🛏️ Found bed nearby, setting spawn...');
    await bot.activateBlock(bed);
    bot.chat('✅ Respawn point set!');
    console.log('✅ Respawn point set successfully!');
  } catch (err) {
    console.log(`⚠️ Failed to set spawn: ${err.message}`);
  }
}
