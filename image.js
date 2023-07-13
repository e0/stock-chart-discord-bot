const fetch = require('node-fetch')
const puppeteer = require('puppeteer')

let browser

const generateImage = async (symbol, timeframe, dateString) => {
  if (!browser) {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  const page = await browser.newPage()
  let genUrl = `${process.env.STOCK_CHART_GENERATOR_URL}/chart/${symbol}`
  if (timeframe) {
    genUrl += `?timeframe=${timeframe}`
  }
  if (dateString) {
    const s = timeframe ? '&' : '?'
    genUrl += `${s}date=${dateString}`
  }

  await page.goto(genUrl, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  })

  await page.waitForSelector('img') // Make sure the image is loaded

  const imageData = await page.evaluate(
    'document.querySelector("img").getAttribute("src")',
  )
  await page.close()

  return convertToImageStream(imageData)
}

const getCachedImage = async (symbol, timeframe, dateString) => {
  let imageDataUrl = `${process.env.STOCK_CHART_WORKER_URL}/images/${symbol}`
  imageDataUrl += `/${timeframe || 'daily'}`
  imageDataUrl += `/${dateString || new Date().toISOString().slice(0, 10)}`

  const response = await fetch(imageDataUrl)

  if (response.status !== 200) {
    throw new Error(
      `Chart could not be loaded for ${symbol}, please try later.`,
    )
  }

  const imageData = await response.text()
  return convertToImageStream(imageData)
}

const convertToImageStream = (imageData) => {
  const image = imageData.split('base64,')[1]
  const imageStream = Buffer.alloc(image.length, image, 'base64')
  return imageStream
}

module.exports = { generateImage, getCachedImage }
