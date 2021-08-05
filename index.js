require('dotenv').config()
const { Client, MessageAttachment, MessageEmbed } = require('discord.js')
const { generateImage, getCachedImage } = require('./image')

const client = new Client()

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', async (msg) => {
  if (msg.content.startsWith('!chart ')) {
    const [command, symbol, ...args] = msg.content.split(' ')
    let timeframe

    if (args.includes('-w') || args.includes('--weekly')) {
      timeframe = 'weekly'
    }

    if (args.includes('-m') || args.includes('--monthly')) {
      timeframe = 'monthly'
    }

    try {
      let imageStream

      try {
        imageStream = await getCachedImage(symbol, timeframe)
      } catch {
        imageStream = await generateImage(symbol, timeframe)
      }

      const reply = `Here is the ${
        timeframe || 'daily'
      } chart for ${symbol.toUpperCase()}.`
      const attachment = new MessageAttachment(imageStream)
      msg.channel.send(reply, attachment)
    } catch (e) {
      msg.channel.send(
        `Chart could not be loaded for ${symbol}, please try later.`,
      )

      console.error(e)
    }
  }
})

client.login(process.env.DISCORD_API_TOKEN)
