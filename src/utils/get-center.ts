import type { Browser } from 'puppeteer-core'

import { BASE_URL, URL_REGEX } from '../constants'
import { runCentre } from '../run-centre'
import logger from '../logger'
import type { CentreData } from '../types'
import { toTitleCase } from './to-title-case'

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
