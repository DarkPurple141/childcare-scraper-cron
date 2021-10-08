import { NextApiRequest, NextApiResponse } from 'next'
import { runPostcode } from '../../src/run-postcode'
import { simplifyLocality } from '../../src/utils'
import * as puppeteer from 'puppeteer-core'
import chrome from 'chrome-aws-lambda'
import { Browser } from 'puppeteer-core'
import { logger } from '../../src/logger'
import { join } from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    let browser: Browser | null = null
    try {
      const { authorization } = req.headers

      if (authorization === `Bearer ${process.env.API_SECRET_KEY}`) {
        browser = await puppeteer.launch({
          // args: chrome.args,
          executablePath:
            process.env.NODE_ENV === 'production'
              ? await chrome.executablePath
              : join(
                  __dirname,
                  '../../../../node_modules/puppeteer/.local-chromium/mac-901912/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
                ),
          headless: chrome.headless,
        })
        logger.info('[Browser]: Init successful')
        const page = await browser.newPage()
        logger.info('[Browser]: New page creation successful')
        const data = await runPostcode(
          page,
          simplifyLocality({
            id: 4497,
            postcode: '2010',
            locality: 'DARLINGHURST',
            state: 'NSW',
            long: 151.212262,
            lat: -33.884119,
            dc: 'WATERLOO DELIVERY FACILITY',
            type: 'Delivery Area',
            status: 'Updated 6-Feb-2020',
            sa3: '11703',
            sa3name: 'Sydney Inner City',
            sa4: '117',
            sa4name: 'Sydney - City and Inner South',
            region: 'R1',
          })
        )
        res.status(200).json(data)
      } else {
        res.status(401).json({ success: false })
      }
    } catch (err) {
      logger.warn((err as Error).message)
      res.status(500).json({ statusCode: 500, message: (err as Error).message })
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}
