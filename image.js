const fetch = require('node-fetch')
const puppeteer = require('puppeteer')

let browser

const generateImage = async (symbol) => {
  if (!browser) {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  const page = await browser.newPage()
  const genUrl = `${process.env.STOCK_CHART_GENERATOR_URL}/chart/${symbol}`
  await page.goto(genUrl, {
    waitUntil: 'networkidle0',
  })
  const imageData = await page.evaluate(
    'document.querySelector("img").getAttribute("src")',
  )
  await page.close()

  return convertToImageStream(imageData)
}

const getCachedImage = async (symbol) => {
  const imageDataUrl = `${process.env.STOCK_CHART_WORKER_URL}/images/${symbol}`
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
