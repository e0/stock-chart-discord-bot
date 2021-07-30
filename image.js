const fetch = require('node-fetch')
const puppeteer = require('puppeteer')

let browser

const generateImage = async (symbol) => {
  if (!browser) {
    browser = await puppeteer.launch()
  }

  const page = await browser.newPage()
  const genUrl = `${process.env.STOCK_CHART_GENERATOR_URL}/chart/${symbol}`
  await page.goto(genUrl, {
    waitUntil: 'networkidle0',
  })
  await page.close()
}

const getImageStream = async ({ symbol, tries }) => {
  if (tries <= 0) {
    return
  }

  const imageDataUrl = `${process.env.STOCK_CHART_WORKER_URL}/images/${symbol}`
  const response = await fetch(imageDataUrl)

  if (response.status !== 200) {
    if (response.status === 404 && tries > 1) {
      // image hasn't been uploaded to Worker yet, wait 200ms and try again
      await new Promise((resolve) => setTimeout(resolve, 500))
      return await getImageStream({ symbol, tries: tries - 1 })
    }
    throw new Error(
      `Chart could not be loaded for ${symbol}, please try later.`,
    )
  }
  const imageData = await response.text()
  const image = imageData.split('base64,')[1]
  const imageStream = Buffer.alloc(image.length, image, 'base64')
  return imageStream
}

module.exports = { generateImage, getImageStream }
