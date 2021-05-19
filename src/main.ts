import { launch } from 'puppeteer'
import Queue from 'queue'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { logger } from './logger'
import { runPostcode } from './run-postcode'
import { makeQueue } from './scheduler'
import { getMemoryUsage, simplifyLocality } from './utils'
import { join } from 'path'
import { createWriter } from './writer'

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
  const outputStream = createWriter()
  const { jobQueue, makeJob } = makeQueue(browser, outputStream)
  const masterQueue = new Queue({ concurrency: 3, autostart: true })

  const seen = new Set()

  const rl = createInterface({
    input: createReadStream(join(__dirname, './data/postcodes_newlines')),
  })

  masterQueue.on('end', () => {
    logger.info('[Master Queue] queue exhausted restarting stream')
    logger.info(getMemoryUsage())
    rl.resume()
  })

  rl.on('line', (line: string) => {
    const locality = simplifyLocality(JSON.parse(line))

    if (masterQueue.length > 5) {
      logger.info('[Master Queue] queue size at threshold, pausing stream')
      logger.info(getMemoryUsage())
      rl.pause()
    }

    masterQueue.push(async () => {
      const page = await browser.newPage()
      logger.info(
        `[Postcode] Starting ${locality.suburb} (${locality.postcode})`
      )
      try {
        // NOTE: opportunity to have this run outside the process
        const centreIds = await runPostcode(page, locality)

        // NOTE: this could push to SQS
        centreIds
          .filter((centre) => !seen.has(centre.id))
          .forEach((centre) => {
            // only process a centre once and once only
            seen.add(centre.id)

            // q the job
            jobQueue.push(makeJob(centre))
          })
        logger.info(`[Postcode] ${locality.suburb} (${locality.postcode}) done`)
      } catch (e) {
        logger.error(
          `[Postcode] ${locality.suburb} (${locality.postcode}) failed`,
          e
        )
      }

      await page.close()
    })
  })
}

main()
