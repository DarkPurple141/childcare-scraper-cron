import type { Browser, Page } from 'puppeteer-core'
import * as puppeteer from 'puppeteer-core'
import chrome from 'chrome-aws-lambda'
import { join } from 'path'

import { BASE_URL, URL_REGEX } from './constants'
import { runCentre } from './run-centre'
import { logger } from './logger'
import type { Locality, CentreData } from './types'

/**
 * @example
 * 'str' => 'Str'
 * 'str str' => 'Str Str'
 * @param str generic string
 */
export function toTitleCase(str: string) {
  return str.replace(/\+/g, ' ').replace(/(^|\s)\S/g, function (t) {
    return t.toUpperCase()
  })
}

export function getMemoryUsage() {
  const used = process.memoryUsage().heapUsed / 1024 / 1024
  return `[Memory] The script is using approximately ${
    Math.round(used * 100) / 100
  } MB`
}

export function simplifyLocality({
  l: locality,
  p: postcode,
  s: state,
}: {
  l: string
  p: string
  s: string
}): Locality {
  return {
    suburb: toTitleCase(locality.toLowerCase()),
    postcode,
    state: state.toLowerCase(),
    id: locality.toLowerCase(),
  }
}

/**
 * @param b        The Puppeteer browser instance
 * @param callback User provided callback to be safely passed the page instance
 * @returns        Dependent on the callback
 */
export async function getPageSafely<T>(
  browser: Browser,
  callback: (page: Page) => T
) {
  const p = await browser.newPage()
  logger.info('[Browser]: New page creation successful.')
  let result: T | null = null

  try {
    result = await callback(p)
  } catch (e) {
    // errors here should only occur if the callback fails
    logger.warn(`Error getting data for ${p.url()}: ${(e as Error).message}`)
  } finally {
    logger.info('[Browser]: Cleaning up page.')
    await p.close()
  }

  return result
}

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
            '../../../../node_modules/puppeteer/.local-chromium/mac-901912/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
          ),
    headless: chrome.headless,
  })
  logger.info('[Browser]: Init')
  return browser
}

export const getCentreDataFactory =
  (browser: Browser) => async (centre: CentreData) => {
    logger.info(
      `[CentreData] Starting to get centre information for ${centre.title}`
    )

    const page = await browser.newPage()
    const link = `${BASE_URL}${centre.link}`

    const { fees, contact = {}, meta } = await runCentre(page, link)

    await page.close()

    if (!fees) {
      logger.warn(`[Missing CentreData] no fees found for ${centre.title}`)
    } else {
      logger.info(`[CentreData] fetched ${centre.title} fees successfully`)
    }

    // @ts-ignore
    const [, postcode = '', raw_suburb = ''] = link.match(URL_REGEX)

    return {
      ...centre,
      ...meta,
      ...contact,
      postcode,
      state: centre.state.toUpperCase(),
      suburb: toTitleCase(raw_suburb || centre.suburb),
      link,
      fees,
    }
  }
