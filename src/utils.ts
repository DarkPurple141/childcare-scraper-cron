import type { Browser, Page } from 'puppeteer'
import { logger } from './logger'
import * as path from 'path'

/**
 * @example
 * 'str' => 'Str'
 * 'str str' => 'Str Str'
 * @param str generic string
 */
export function toTitleCase(str: string) {
  return str.replace(/(^|\s)\S/g, function (t) {
    return t.toUpperCase()
  })
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

  try {
    return callback(p)
  } catch (e) {
    // errors here should only occur if the callback fails
    logger.warn(`Error getting data for ${p.url()}`, e)
    await p.screenshot({
      fullPage: true,
      path: path.join(
        __dirname,
        `../errors/${p.url().split('/').join('-')}.png`
      ),
    })
  } finally {
    await p.close()
  }
}
