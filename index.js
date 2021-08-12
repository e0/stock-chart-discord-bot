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
    let timeframe, dateString

    if (args.includes('-w') || args.includes('--weekly') || args.includes('—weekly')) {
      timeframe = 'weekly'
    }

    if (args.includes('-m') || args.includes('--monthly') || args.includes('—monthly')) {
      timeframe = 'monthly'
    }

    if (args.includes('-h') || args.includes('--hourly') || args.includes('—hourly')) {
      timeframe = 'hourly'
    }

    if (args.includes('-d')) {
      dateString = args[args.indexOf('-d') + 1]
    } else if (args.includes('--date')) {
      dateString = args[args.indexOf('--date') + 1]
    }

    try {
      let imageStream

      try {
        imageStream = await getCachedImage(symbol, timeframe, dateString)
      } catch {
        imageStream = await generateImage(symbol, timeframe, dateString)
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
