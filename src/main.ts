import { launch } from 'puppeteer'
import Queue from 'queue'
import postcodes from './data/postcodes.json'
import { runPostcode } from './run-postcode'
import { makeQueue } from './scheduler'
import { Locality } from './types'
import { toTitleCase } from './utils'

const nswPostCodes: Locality[] = (postcodes as any[])
  .filter(({ postcode }) => postcode.startsWith('20'))
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
  const browser = await launch({ headless: true })
  const { jobQueue, makeJob } = makeQueue(browser)
  const masterQueue = new Queue({ concurrency: 3, autostart: true })

  const seen = new Set()

  nswPostCodes.forEach((postcode) => {
    masterQueue.push(async () => {
      const page = await browser.newPage()
      try {
        const centreIds = await runPostcode(page, postcode)
        centreIds.forEach((centre) => {
          if (seen.has(centre.id)) {
            return
          }

          // only process a centre once and once only
          seen.add(centre.id)

          // q the job
          jobQueue.push(makeJob(centre))
        })
      } catch (e) {
        console.warn(e)
        console.warn(postcode.suburb)
        console.warn(postcode.postcode)
      }
      console.warn(`[${postcode.suburb} (${postcode.postcode})] done`)
      await page.close()
    })
  })
}

main()
