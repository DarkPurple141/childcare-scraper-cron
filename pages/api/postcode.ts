import { NextApiRequest, NextApiResponse } from 'next'
import { runPostcode } from '../../src/run-postcode'
import { simplifyLocality } from '../../src/utils'
import * as puppeteer from 'puppeteer'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { authorization } = req.headers

      if (authorization === `Bearer ${process.env.API_SECRET_KEY}`) {
        const browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage()
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
      res.status(500).json({ statusCode: 500, message: (err as Error).message })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}
