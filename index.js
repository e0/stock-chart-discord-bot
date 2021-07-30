require('dotenv').config()
const { Client, MessageAttachment, MessageEmbed } = require('discord.js')
const { generateImage, getCachedImage } = require('./image')

const client = new Client()

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', async (msg) => {
  if (msg.content.startsWith('!chart ')) {
    const [symbol] = msg.content.split(' ').splice(1)

    try {
      let imageStream

      try {
        imageStream = await getCachedImage(symbol)
      } catch {
        imageStream = await generateImage(symbol)
      }

      const reply = `Here is the chart for ${symbol.toUpperCase()}.`
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
