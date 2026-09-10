// AFK bot for GitHub Actions.
// Reads server details from environment variables (set as GitHub repo secrets)
// so you never hardcode them into the file itself.

const mineflayer = require('mineflayer')

const HOST = process.env.MC_HOST
const PORT = process.env.MC_PORT ? Number(process.env.MC_PORT) : 25565
const USERNAME = process.env.MC_USERNAME
const AUTH = process.env.MC_AUTH || 'offline' // 'offline' or 'microsoft'

if (!HOST || !USERNAME) {
  console.error('Missing MC_HOST or MC_USERNAME environment variables/secrets.')
  process.exit(1)
}

console.log(`Connecting to ${HOST}:${PORT} as ${USERNAME} (auth: ${AUTH})...`)

const bot = mineflayer.createBot({
  host: HOST,
  port: PORT,
  username: USERNAME,
  auth: AUTH
})

bot.once('spawn', () => {
  console.log('Connected and spawned in.')

  setInterval(() => {
    bot.look(Math.random() * Math.PI * 2, 0, true)
    if (Math.random() < 0.3) {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
    }
  }, 20000)
})

bot.on('chat', (username, message) => {
  console.log(`<${username}> ${message}`)
})

bot.on('kicked', (reason) => {
  console.log('Kicked, raw reason:', JSON.stringify(reason))
  process.exit(0)
})

bot.on('error', (err) => {
  console.log('Error:', err.message)
  console.log('Full error:', err.stack)
})

bot.on('end', (reason) => {
  console.log('Disconnected. Reason given:', reason || '(none provided)')
  process.exit(0)
})

// Extra diagnostics: log every raw packet the server sends before disconnecting,
// so we can see exactly what happened even if no clean reason is given.
bot._client.on('packet', (data, meta) => {
  if (meta.name === 'kick_disconnect' || meta.name === 'disconnect') {
    console.log('Raw disconnect packet:', JSON.stringify(data))
  }
})

// Safety valve: if GitHub is about to kill the job (6h hard cap),
// exit cleanly a bit early so the next scheduled run starts fresh.
setTimeout(() => {
  console.log('Approaching time limit, exiting cleanly so the next run can start.')
  process.exit(0)
}, 5.75 * 60 * 60 * 1000) // 5h45m
