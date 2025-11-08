const mineflayer = require('mineflayer')
const express = require('express')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// 🌍 Configuration
const config = {
  host: 'Anasvirat18.aternos.me',
  port: 35369,
  username: 'AutoBot',
  version: '1.21.5'
}

let bot
let botStatus = {
  connected: false,
  lastConnected: null,
  lastError: null
}

// 🧠 Function to start the bot
function startBot() {
  console.log('🚀 Starting Minecraft bot...')
  bot = mineflayer.createBot(config)

  bot.once('spawn', () => {
    botStatus.connected = true
    botStatus.lastConnected = new Date().toLocaleString()
    console.log(`✅ Bot connected successfully (Minecraft ${bot.version})`)
    randomMove()
    setInterval(jump, 3000)
  })

  // 🎮 Movement + Actions
  function randomMove() {
    const directions = ['forward', 'back', 'left', 'right']
    setInterval(() => {
      const move = directions[Math.floor(Math.random() * directions.length)]
      bot.setControlState(move, true)
      setTimeout(() => bot.setControlState(move, false), 1000)
    }, 5000)
  }

  function jump() {
    if (!botStatus.connected) return
    bot.setControlState('jump', true)
    setTimeout(() => bot.setControlState('jump', false), 500)
  }

  async function breakBlock() {
    const block = bot.blockAt(bot.entity.position.offset(0, -1, 0))
    if (!block) return
    try {
      await bot.dig(block)
      console.log('⛏️ Broke block:', block.name)
    } catch (err) {
      console.log('❌ Error breaking block:', err.message)
    }
  }

  async function placeBlock() {
    const base = bot.blockAt(bot.entity.position.offset(0, -1, 0))
    if (!base) return
    const item = bot.inventory.items().find(i => i.name.includes('stone') || i.name.includes('dirt'))
    if (!item) return console.log('🪨 No blocks to place.')
    try {
      await bot.equip(item, 'hand')
      await bot.placeBlock(base, { x: 0, y: 1, z: 0 })
      console.log('✅ Placed block.')
    } catch (err) {
      console.log('❌ Error placing block:', err.message)
    }
  }

  // 💬 Chat commands
  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    if (message === 'jump') jump()
    if (message === 'break') breakBlock()
    if (message === 'place') placeBlock()
  })

  // 🔁 Auto-reconnect logic
  bot.on('end', () => {
    console.log('🔄 Bot disconnected. Reconnecting in 10s...')
    botStatus.connected = false
    setTimeout(startBot, 10000)
  })

  bot.on('kicked', (reason) => {
    console.log('🚪 Kicked:', reason)
    botStatus.connected = false
    console.log('🔁 Reconnecting in 10s...')
    setTimeout(startBot, 10000)
  })

  bot.on('error', (err) => {
    console.log('⚠️ Error:', err.message)
    botStatus.lastError = err.message
    botStatus.connected = false
    console.log('⏳ Retrying connection in 20s...')
    setTimeout(startBot, 20000)
  })
}

startBot()

// 🌐 Serve public dashboard
app.use(express.static(path.join(__dirname, 'public')))

// 📡 API route for live bot status
app.get('/status', (req, res) => {
  res.json({
    connected: botStatus.connected,
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version,
    lastConnected: botStatus.lastConnected,
    lastError: botStatus.lastError
  })
})

// 🟢 Start Express (important: bind 0.0.0.0 for Render)
app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`🌍 Web dashboard running on port ${process.env.PORT || 3000}`)
})
