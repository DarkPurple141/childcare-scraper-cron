import { NextApiRequest, NextApiResponse } from 'next'
import { runPostcode } from '../../src/run-postcode'
import { initBrowser, simplifyLocality } from '../../src/utils'
import { Browser } from 'puppeteer-core'
import { logger } from '../../src/logger'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    let browser: Browser | null = null
    try {
      const { authorization } = req.headers

      if (authorization === `Bearer ${process.env.API_SECRET_KEY}`) {
        browser = await initBrowser()
        const page = await browser.newPage()
        logger.info('[Browser]: Created new page')
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
      logger.info('[Browser]: Cleanup')
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}
