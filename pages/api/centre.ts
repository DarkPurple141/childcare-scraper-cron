import type { NextApiRequest, NextApiResponse } from 'next'
import { initBrowser } from '../../src/utils/init-browser'
import { getCentreDataFactory } from '../../src/utils/get-center'
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
        const getCentreData = getCentreDataFactory(browser)
        const bodyData = JSON.parse(req.body)

        const data = await Promise.all((bodyData || []).map(getCentreData))

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
