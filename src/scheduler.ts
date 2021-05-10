import type { Browser } from 'puppeteer'
import path from 'path'
import Queue from 'queue'
import { createWriteStream } from 'fs'
import { baseUrl } from './constants'
import { logger } from './logger'
import { runCentre } from './run-centre'
import type { CentreData } from './types'
import { getPageSafely } from './utils'

export function makeQueue(browser: Browser) {
  const jobQueue = new Queue({ autostart: true, concurrency: 5 })
  const stream = createWriteStream(path.join(__dirname, '../data2.json'), {
    flags: 'a',
  })
  stream.write('[')
  jobQueue.on('success', (result?: CentreData) => {
    if (result && result.fees) {
      logger.info(result)
      stream.write(`${JSON.stringify(result, null, 2)},`)
    }
  })

  jobQueue.on('end', async () => {
    await browser.close()
    stream.end(']', () => logger.info('Program finished'))
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
    logger.info(`Starting to get centre information for ${centre.title}`)

    const p = await browser.newPage()

    const fees = await runCentre(p, centre.link)
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
      link: `${baseUrl}${centre.link}`,
      fees,
    }
  }
}
