require('dotenv').config()
const { Client, MessageAttachment, MessageEmbed } = require('discord.js')
const { generateImage, getImageStream } = require('./image')

const client = new Client()

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', async (msg) => {
  if (msg.content.startsWith('!chart ')) {
    try {
      const [symbol] = msg.content.split(' ').splice(1)

      try {
        const imageStream = await getImageStream({ symbol, tries: 1 })
        const attachment = new MessageAttachment(imageStream)
        msg.channel.send(attachment)
      } catch {
        await generateImage(symbol)
        const imageStream = await getImageStream({ symbol, tries: 3 })
        const attachment = new MessageAttachment(imageStream)
        msg.channel.send(attachment)
      }
    } catch (e) {
      msg.channel.send(e.message)
    }
  }
})

client.login(process.env.DISCORD_API_TOKEN)
