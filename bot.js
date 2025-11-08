const mineflayer = require('mineflayer')

// 🧠 Bot Configuration
const config = {
  host: 'Anasvirat18.aternos.me', // 🌍 Your server IP
  port: 35369,                    // 🔌 Your port
  username: 'AllVersionBot',      // 💬 Bot name
  version: false                  // 🧩 Auto-detects Minecraft version
}

// 🟢 Start Bot
function startBot() {
  const bot = mineflayer.createBot(config)

  bot.on('spawn', () => {
    console.log('✅ Bot spawned in world! (version: ' + bot.version + ')')

    // Start random movement + jumping
    randomMove(bot)
    setInterval(() => jump(bot), 3000)
  })

  // Random walking
  function randomMove(bot) {
    const directions = ['forward', 'back', 'left', 'right']
    setInterval(() => {
      const dir = directions[Math.floor(Math.random() * directions.length)]
      bot.setControlState(dir, true)
      setTimeout(() => bot.setControlState(dir, false), 1000)
    }, 4000)
  }

  // Jump function
  function jump(bot) {
    bot.setControlState('jump', true)
    setTimeout(() => bot.setControlState('jump', false), 400)
  }

  // Break block below
  async function breakBlock(bot) {
    const block = bot.blockAt(bot.entity.position.offset(0, -1, 0))
    if (!block) return console.log('⚠️ No block below to break.')
    console.log('⛏️ Breaking:', block.name)
    try {
      await bot.dig(block)
      console.log('✅ Block broken.')
    } catch (err) {
      console.log('❌ Error breaking block:', err.message)
    }
  }

  // Place block on top
  async function placeBlock(bot) {
    const blockBelow = bot.blockAt(bot.entity.position.offset(0, -1, 0))
    if (!blockBelow) return console.log('⚠️ No block below to place on.')
    const item = bot.inventory.items().find(i => i.name.includes('stone') || i.name.includes('dirt'))
    if (!item) return console.log('🪨 No block in inventory!')
    try {
      await bot.equip(item, 'hand')
      await bot.placeBlock(blockBelow, { x: 0, y: 1, z: 0 })
      console.log('✅ Block placed.')
    } catch (err) {
      console.log('❌ Cannot place block:', err.message)
    }
  }

  // 🗣️ Chat Commands
  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    if (message === 'jump') jump(bot)
    if (message === 'move') randomMove(bot)
    if (message === 'break') breakBlock(bot)
    if (message === 'place') placeBlock(bot)
  })

  // 🧱 Error & Restart Logic
  bot.on('kicked', (reason) => {
    console.log('🚪 Bot kicked:', reason)
    setTimeout(startBot, 5000)
  })

  bot.on('error', (err) => {
    console.log('⚠️ Error:', err.message)
    if (err.message.includes('version')) {
      console.log('🔁 Retrying with auto version...')
      config.version = false
      setTimeout(startBot, 5000)
    }
  })
}

// 🟣 Start it up
startBot()
