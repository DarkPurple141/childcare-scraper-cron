import { NextApiRequest, NextApiResponse } from 'next'
import { runPostcode } from '../../src/run-postcode'
import { initBrowser } from '../../src/utils/init-browser'
import { simplifyLocality } from '../../src/utils/simplify-locality'
import type { Browser } from 'puppeteer-core'
import logger from '../../src/logger'

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
            p: '2010',
            l: 'DARLINGHURST',
            s: 'NSW',
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
