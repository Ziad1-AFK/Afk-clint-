// AFK bot for GitHub Actions.
// Reads server details from environment variables (set as GitHub repo secrets)
// so you never hardcode them into the file itself.

const mineflayer = require('mineflayer')

const HOST = process.env.MC_HOST
const PORT = process.env.MC_PORT ? Number(process.env.MC_PORT) : 25565
const USERNAME = process.env.MC_USERNAME
const AUTH = process.env.MC_AUTH || 'offline'

if (!HOST || !USERNAME) {
  console.error('Missing MC_HOST or MC_USERNAME environment variables/secrets.')
  process.exit(1)
}

console.log(`Connecting to ${HOST}:${PORT} as ${USERNAME} (auth: ${AUTH})...`)

const bot = mineflayer.createBot({
  host: HOST,
  port: PORT,
  username: USERNAME,
  auth: AUTH,
  version: '1.21.4',
  profilesFolder: './nmp-cache'
})

console.log('Using protocol version: 1.21.4')

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

bot._client.on('connect', () => {
  console.log('Raw TCP connection established to server.')
})

bot._client.on('state', (newState) => {
  console.log('Protocol state changed to:', newState)
})

bot._client.on('packet', (data, meta) => {
  if (meta.name === 'kick_disconnect' || meta.name === 'disconnect') {
    console.log('Raw disconnect packet:', JSON.stringify(data))
  }
})

setTimeout(() => {
  console.log('Approaching time limit, exiting cleanly so the next run can start.')
  process.exit(0)
}, 5.75 * 60 * 60 * 1000)
