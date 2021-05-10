import { launch } from 'puppeteer'
import Queue from 'queue'
import rawPostcodes from './data/postcodes.json'
import { logger } from './logger'
import { runPostcode } from './run-postcode'
import { makeQueue } from './scheduler'
import type { Locality } from './types'
import { toTitleCase } from './utils'

const postCodes: Locality[] = (rawPostcodes as any[])
  .filter(({ postcode }) => postcode.startsWith('2010'))
  .map(({ locality, postcode }) => ({
    suburb: toTitleCase((locality as string).toLowerCase()),
    postcode,
    id: (locality as string).toLowerCase(),
  }))

// get page [...postcodes]

// check ids
// -- if id exists don't add to list
// -- if id does exist add to list to process
//
// go to next page until no pages in pagination
//
// continue outer loop

// job queue -> every valid id that is added is added to queue
// jobs are pulled off and processed by workers
async function main() {
  logger.info(`Starting puppeteer..`)
  const browser = await launch({ headless: true })
  const { jobQueue, makeJob } = makeQueue(browser)
  const masterQueue = new Queue({ concurrency: 3, autostart: true })

  const seen = new Set()

  postCodes.forEach((postcode) => {
    masterQueue.push(async () => {
      const page = await browser.newPage()
      logger.info(
        `[Postcode] Starting ${postcode.suburb} (${postcode.postcode})`
      )
      try {
        // NOTE: opportunity to have this run outside the process
        const centreIds = await runPostcode(page, postcode)

        // NOTE: this could push to SQS
        centreIds
          .filter((centre) => !seen.has(centre.id))
          .forEach((centre) => {
            // only process a centre once and once only
            seen.add(centre.id)

            // q the job
            jobQueue.push(makeJob(centre))
          })
        logger.info(`[Postcode] ${postcode.suburb} (${postcode.postcode}) done`)
      } catch (e) {
        logger.warn(
          `[Postcode] ${postcode.suburb} (${postcode.postcode}) failed`,
          e
        )
      }

      await page.close()
    })
  })
}

main()
