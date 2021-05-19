import type { Browser } from 'puppeteer'
import Queue from 'queue'
import { baseUrl } from './constants'
import { logger } from './logger'
import { runCentre } from './run-centre'
import type { CentreData } from './types'
import { getMemoryUsage, getPageSafely } from './utils'
import type { WriteStream } from 'fs'

export function makeQueue(browser: Browser, outputStream: WriteStream) {
  const jobQueue = new Queue({ autostart: true, concurrency: 5 })

  jobQueue.on('success', (result?: CentreData) => {
    if (result && result.fees) {
      logger.info(result)
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

export const getCentreDataFactory = (browser: Browser) => (
  centre: CentreData
) => {
  // this function is called when the a job is ready to be processed in the queue
  return async () => {
    logger.info(
      `[CentreData] Starting to get centre information for ${centre.title}`
    )

    const p = await browser.newPage()

    const { fees, contact = {} } = await runCentre(p, centre.link)
    // const fees = await getPageSafely(browser, async (page) =>
    //   runCentre(page, centre.link)
    // )
    await p.close()

    if (!fees) {
      logger.warn(`[Missing CentreData] no fees found for ${centre.title}`)
    } else {
      logger.info(`[CentreData] fetched ${centre.title} fees successfully`)
    }

    return {
      ...centre,
      ...contact,
      link: `${baseUrl}${centre.link}`,
      fees,
    }
  }
}
