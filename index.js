require('dotenv').config()
const {
  Client,
  Intents,
  MessageAttachment,
  MessageEmbed,
} = require('discord.js')
const cron = require('node-cron')
const { generateImage, getCachedImage } = require('./image')
const { getDailyEarnings } = require('./earnings')

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})

const clearCronJobs = async () => {
  cron.getTasks().forEach((task) => task.stop())
}

const sendEarnings = (channel, lines) => {
  for (const line of lines) {
    channel.send(line)
  }
}

const setupCron = () => {
  clearCronJobs()

  const earningsChannels = require('./earningsChannels.json')
  if (!earningsChannels) return

  client.guilds.cache.each((guild) => {
    const matches = earningsChannels.filter(
      (channel) => channel.guildId === guild.id,
    )
    if (!matches) return

    matches.forEach(({ channelId }) => {
      const channel = guild.channels.cache.get(channelId)
      if (!channel) return

      cron.schedule(
        '00 07 * * mon-fri',
        async () => {
          const earnings = await getDailyEarnings()
          console.log(`Sending earnings to ${channel.name} in ${guild.name}`)
          channel.send(earnings)
        },
        {
          name: `${guild.id}-${channelId}`,
          scheduled: true,
          timezone: 'America/New_York',
        },
      )
    })
  })
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
  setupCron()
})

// TODO: add white listed server ids here
const serverWhitelist = []
client.on('messageCreate', async (msg) => {
  const serverId = msg.channel.guild.id

  if (!serverWhitelist.includes(serverId)) {
    console.log(`Unauthorized attempt from ${serverId}`)
    return
  }

  const lines = msg.content.split('\n')

  if (lines[0].startsWith('!setup-daily-earnings')) {
    const earnings = await getDailyEarnings(msg.guild.id, msg.channelId)
    if (earnings) {
      sendEarnings(msg.channel, earnings)
      msg.channel.send(
        'This channel is now set up for daily earnings. The bot will post the daily earnings here every day at 7:00 AM EST (given that there are companies reporting).',
      )
    }
    setupCron()
  }

  for (const line of lines) {
    if (line.startsWith('!chart ')) {
      const [command, symbol, ...args] = line.split(' ')
      let timeframe, dateString

      if (
        args.includes('-w') ||
        args.includes('--weekly') ||
        args.includes('—weekly')
      ) {
        timeframe = 'weekly'
      }

      if (
        args.includes('-m') ||
        args.includes('--monthly') ||
        args.includes('—monthly')
      ) {
        timeframe = 'monthly'
      }

      if (
        args.includes('-h') ||
        args.includes('--hourly') ||
        args.includes('—hourly')
      ) {
        timeframe = 'hourly'
      }

      if (args.includes('-d')) {
        dateString = args[args.indexOf('-d') + 1]
      } else if (args.includes('--date')) {
        dateString = args[args.indexOf('--date') + 1]
      } else if (args.includes('—date')) {
        dateString = args[args.indexOf('—date') + 1]
      }

      try {
        let imageStream

        try {
          imageStream = await getCachedImage(symbol, timeframe, dateString)
        } catch {
          imageStream = await generateImage(symbol, timeframe, dateString)
        }

        const attachment = new MessageAttachment(imageStream)
        msg.channel.send({ files: [attachment] })
      } catch (e) {
        msg.channel.send(
          `Chart could not be loaded for ${symbol}, please try later.`,
        )

        console.error(e)
      }
    }
  }
})

client.login(process.env.DISCORD_API_TOKEN)
