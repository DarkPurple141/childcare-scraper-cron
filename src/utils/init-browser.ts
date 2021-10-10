import * as puppeteer from 'puppeteer-core'
import chrome from 'chrome-aws-lambda'
import { join } from 'path'
import logger from '../logger'

export async function initBrowser() {
  const browser = await puppeteer.launch({
    args: chrome.args,
    executablePath:
      process.env.NODE_ENV === 'production'
        ? await chrome.executablePath
        : join(
            __dirname,
            '../../../../node_modules/puppeteer/.local-chromium/mac-869685/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
          ),
    headless: true,
    ignoreHTTPSErrors: true,
  })
  logger.info('[Browser]: Init')
  return browser
}
