const mineflayer = require('mineflayer');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 🌍 Minecraft Server Config (change this to your Aternos info)
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

// ✨ Random username for every reconnect
function randomUsername() {
  const id = Math.floor(Math.random() * 10000);
  return `AutoBot_${id}`;
}

// 🧠 Start Bot
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
    console.log(`✅ Bot connected successfully (Minecraft ${bot.version})`);

    // Start AFK behavior
    startAFKTasks();

    // Look for nearby bed to set spawn
    setTimeout(checkForBed, 5000);
  });

  bot.on('end', () => {
    console.log('🔌 Bot disconnected.');
    botStatus.connected = false;
    scheduleReconnect(90000);
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

  // If bot spawns in night and sees bed, set spawn again
  bot.on('time', () => {
    if (bot.time.timeOfDay % 24000 > 12541 && bot.time.timeOfDay % 24000 < 23460) {
      checkForBed();
    }
  });
}

// 🔁 Safe Reconnect
function scheduleReconnect(delay = 90000) {
  if (reconnectTimeout) return;
  console.log(`🔁 Reconnecting in ${delay / 1000}s...`);
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    startBot();
  }, delay);
}

// 🎮 AFK movement + breaking + jumping
function startAFKTasks() {
  setInterval(() => {
    if (!botStatus.connected) return;

    const actions = ['forward', 'back', 'left', 'right'];
    const move = actions[Math.floor(Math.random() * actions.length)];

    bot.setControlState(move, true);
    bot.look(Math.random() * Math.PI * 2, 0); // Randomly turn head
    setTimeout(() => bot.setControlState(move, false), 1000);

    // Jump sometimes
    if (Math.random() > 0.5) {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 300);
    }

    // Break random block under feet sometimes
    if (Math.random() > 0.7) breakBlockBelow();
  }, 5000);
}

// ⛏️ Break block below bot
async function breakBlockBelow() {
  const target = bot.blockAt(bot.entity.position.offset(0, -1, 0));
  if (!target || target.name.includes('bedrock')) return;
  try {
    await bot.dig(target);
    console.log('⛏️ Broke block:', target.name);
  } catch (err) {
    console.log('❌ Failed to break block:', err.message);
  }
}

// 🛏️ Check for bed nearby and set spawn
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
    console.log('🛏️ Found bed nearby, setting spawn point...');
    await bot.activateBlock(bed);
    console.log('✅ Respawn point set successfully!');
  } catch (err) {
    console.log('⚠️ Failed to set spawn:', err.message);
  }
}

// 🚀 Start after Render service goes live
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

// 🟢 Start web service first
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌍 Web dashboard live on port ${PORT}`);
  console.log('⏳ Waiting 15 seconds for Render to be stable...');
  setTimeout(() => {
    console.log('🚀 Render service stable — joining Minecraft now...');
    startBot();
  }, 15000);
});
