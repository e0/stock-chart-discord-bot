import { blacklist } from './earningsBlacklist'
import { DateTime } from 'luxon'

const formatEarnings = (date, data) => {
  const earnings = data.reduce(
    (acc, curr) => {
      const { symbol, time } = curr
      // only add if symbol contains only letters and the list does not already include the symbol

      if (
        /^[a-zA-Z]+$/.test(symbol) &&
        !acc[time].includes(symbol) &&
        !blacklist.includes(symbol)
      ) {
        acc[time].push(symbol)
      }

      return acc
    },
    { bmo: [], amc: [] },
  )

  const titleLine = `**Earnings ${date} from FMP (filtered)**`

  const initialBmoLine = `***Before Market Open*** (${earnings.bmo.length})`
  const sortedBmo = earnings.bmo.sort()
  const bmoLines = []

  while (sortedBmo.length) {
    bmoLines.push(sortedBmo.splice(0, 200).join(', '))
  }

  const initialAmcLine = `***After Market Close*** (${earnings.amc.length})`
  const sortedAmc = earnings.amc.sort()
  const amcLines = []

  while (sortedAmc.length) {
    amcLines.push(sortedAmc.splice(0, 200).join(', '))
  }

  return [titleLine, initialBmoLine, ...bmoLines, initialAmcLine, ...amcLines]
}

const registerChannel = (guildId, channelId) => {
  const channelsFile = Bun.file('earningsChannels.json')
  if (!channelsFile.size) {
    Bun.write('earningsChannels.json', JSON.stringify([]))
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
    Bun.write(
      'earningsChannels.json',
      JSON.stringify(earningsChannels, null, 2),
    )
  }
}

const getDailyEarnings = async (guildId, channelId) => {
  if (guildId && channelId) {
    registerChannel(guildId, channelId)
  }

  const date = DateTime.now().setZone('America/New_York').toFormat('yyyy-MM-dd')

  const url = `${process.env.FMP_API_URL}/v3/earning_calendar?from=${date}&to=${date}&apikey=${process.env.FMP_API_KEY}`

  const results = await fetch(url)

  if (results.ok) {
    const data = await results.json()
    return data.length ? formatEarnings(date, data) : null
  }

  return null
}

export { getDailyEarnings }
