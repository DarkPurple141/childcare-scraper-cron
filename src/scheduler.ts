import { Browser } from 'puppeteer'
import Queue from 'queue'
import { baseUrl } from './constants'
import { runCentre } from './run-centre'
import type { CentreData } from './types'

export function makeQueue(browser: Browser) {
  const jobQueue = new Queue({ autostart: true, concurrency: 5 })
  console.log('[')
  jobQueue.on('success', (result) => {
    if (result && result.fees) {
      console.log(JSON.stringify(result, null, 2), ',')
    }
  })

  jobQueue.on('end', async () => {
    console.log(']')
    await browser.close()
  })

  return {
    jobQueue,
    makeJob: JobBuilder(browser),
  }
}

export const JobBuilder = (browser: Browser) => (centre: CentreData) => {
  return async () => {
    const page = await browser.newPage()

    const fees = await runCentre(page, centre.link)
    await page.close()

    console.warn(`Centre [${centre.title}] done`)

    return {
      ...centre,
      link: `${baseUrl}${centre.link}`,
      fees,
    }
  }
}
