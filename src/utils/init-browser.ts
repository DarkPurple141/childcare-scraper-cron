import * as puppeteer from 'puppeteer-core'
import chrome from 'chrome-aws-lambda'
import { join } from 'path'
import logger from '../logger'

export async function initBrowser() {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--no-zygote',
      '--use-gl=swiftshader',
      '--window-size=1920,1080',
    ],
    executablePath:
      process.env.NODE_ENV === 'production'
        ? await chrome.executablePath
        : join(
            __dirname,
            '../../../../node_modules/puppeteer/.local-chromium/mac-869685/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
          ),
    headless: chrome.headless,
  })
  logger.info('[Browser]: Init')
  return browser
}
