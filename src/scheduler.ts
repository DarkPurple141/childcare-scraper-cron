import type { Browser } from 'puppeteer'
import Queue from 'queue'
import { BASE_URL, URL_REGEX } from './constants'
import { logger } from './logger'
import { runCentre } from './run-centre'
import type { CentreData } from './types'
import { getMemoryUsage, toTitleCase } from './utils'
import type { WriteStream } from 'fs'

export function makeQueue(browser: Browser, outputStream: WriteStream) {
  const jobQueue = new Queue({ autostart: true, concurrency: 5 })

  jobQueue.on('success', (result?: CentreData) => {
    if (result) {
      logger.info(
        `[CentreData] Writing result for ${result.title}:${result.postcode}:${result.state}`
      )
      outputStream.write(`${JSON.stringify(result, null, 2)},`)
    }
  })

  jobQueue.on('end', async () => {
    logger.info(getMemoryUsage())
  })

  return {
    jobQueue,
    makeJob: getCentreDataFactory(browser),
  }
}

export const getCentreDataFactory =
  (browser: Browser) => (centre: CentreData) => {
    // this function is called when the a job is ready to be processed in the queue
    return async () => {
      logger.info(
        `[CentreData] Starting to get centre information for ${centre.title}`
      )

      const p = await browser.newPage()
      const link = `${BASE_URL}${centre.link}`

      const { fees, contact = {}, meta } = await runCentre(p, link)

      await p.close()

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
  }
