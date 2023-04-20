const fetch = require('node-fetch')
const fs = require('fs')

const formatEarnings = (date, data) => {
  const earnings = data.reduce(
    (acc, curr) => {
      const { symbol, time } = curr
      // only add if symbol does not include a dot
      if (!symbol.includes('.')) {
        acc[time].push(symbol)
      }
      return acc
    },
    { bmo: [], amc: [] },
  )

  const text = `**Earnings ${date} from FMP**

***Before Market Open*** (${earnings.bmo.length})
${earnings.bmo.sort().join(', ')}

***After Market Close*** (${earnings.amc.length})
${earnings.amc.sort().join(', ')}`

  return text
}

const registerChannel = (guildId, channelId) => {
  if (!fs.existsSync('./earningsChannels.json')) {
    fs.writeFileSync('./earningsChannels.json', JSON.stringify([]))
  }
  const earningsChannels = require('./earningsChannels.json')

  const existingChannel = earningsChannels.find(
    (channel) => channel.guildId === guildId && channel.channelId === channelId,
  )

  if (!existingChannel) {
    earningsChannels.push({
      guildId,
      channelId,
    })
    fs.writeFileSync(
      './earningsChannels.json',
      JSON.stringify(earningsChannels, null, 2),
    )
  }
}

const getDailyEarnings = async (guildId, channelId) => {
  if (guildId && channelId) {
    registerChannel(guildId, channelId)
  }

  const date = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/New_York',
  })

  const url = `${process.env.FMP_API_URL}/v3/earning_calendar?from=${date}&to=${date}&apikey=${process.env.FMP_API_KEY}`

  const results = await fetch(url)

  if (results.ok) {
    const data = await results.json()
    return data.length ? formatEarnings(date, data) : null
  }

  return null
}

module.exports = { getDailyEarnings }
