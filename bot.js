const mineflayer = require('mineflayer')

function startBot() {
  const bot = mineflayer.createBot({
    host: 'Anasvirat18.aternos.me', // your Aternos IP
    port: 35369,
    username: 'AutoBot',
    version: '1.21.5' // explicitly set for Java 1.21.5
  })

  bot.once('spawn', () => {
    console.log(`✅ Bot connected successfully (Minecraft ${bot.version})`)
    randomMove(bot)
    setInterval(() => jump(bot), 3000)
  })

  function randomMove(bot) {
    const dirs = ['forward', 'back', 'left', 'right']
    setInterval(() => {
      const move = dirs[Math.floor(Math.random() * dirs.length)]
      bot.setControlState(move, true)
      setTimeout(() => bot.setControlState(move, false), 1000)
    }, 5000)
  }

  function jump(bot) {
    bot.setControlState('jump', true)
    setTimeout(() => bot.setControlState('jump', false), 500)
  }

  async function breakBlock(bot) {
    const block = bot.blockAt(bot.entity.position.offset(0, -1, 0))
    if (!block) return
    try {
      await bot.dig(block)
      console.log('⛏️ Broke block:', block.name)
    } catch (err) {
      console.log('❌ Error breaking block:', err.message)
    }
  }

  async function placeBlock(bot) {
    const blockBelow = bot.blockAt(bot.entity.position.offset(0, -1, 0))
    if (!blockBelow) return
    const item = bot.inventory.items().find(i => i.name.includes('stone'))
    if (!item) return console.log('🪨 No blocks in inventory!')
    try {
      await bot.equip(item, 'hand')
      await bot.placeBlock(blockBelow, { x: 0, y: 1, z: 0 })
      console.log('✅ Placed block.')
    } catch (err) {
      console.log('❌ Error placing block:', err.message)
    }
  }

  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    if (message === 'jump') jump(bot)
    if (message === 'break') breakBlock(bot)
    if (message === 'place') placeBlock(bot)
  })

  bot.on('kicked', (reason) => {
    console.log('🚪 Kicked:', reason)
    console.log('🔁 Reconnecting in 10s...')
    setTimeout(startBot, 10000)
  })

  bot.on('end', () => {
    console.log('🔄 Bot disconnected. Reconnecting in 10s...')
    setTimeout(startBot, 10000)
  })

  bot.on('error', (err) => {
    console.log('⚠️ Error:', err.message)
    if (err.message.includes('ECONNREFUSED') || err.message.includes('Timeout')) {
      console.log('⏳ Server offline. Retrying in 20s...')
      setTimeout(startBot, 20000)
    }
  })
}

startBot()
