import { Page, launch } from 'puppeteer'
import * as p from 'path'
import { baseUrl } from './constants'

export async function runCentre(page: Page, path: string) {
  const url = `${baseUrl}${path}`

  await page.goto(url, { waitUntil: 'networkidle2' })

  const content = await page.evaluate(() => {
    const parent = document.getElementById('acc-fees')
    if (!parent) {
      return null
    }

    const feeGroups = Array.from(parent.querySelectorAll('.accordion__item'))

    if (!feeGroups.length) {
      return null
    }

    const fees = feeGroups
      .map((node) => {
        const type = node.querySelector('h3').textContent
        const feeTypes = Array.from(
          node.querySelectorAll('.service__feesItem:first-of-type')
        ).reduce((acc, fee) => {
          // eg "After School Session": "$30.00",
          const name = fee.querySelector('.service__feesItemName').textContent
          const value = fee.querySelector('.service__feesItemValue').textContent
          return {
            ...acc,
            [name]: value,
          }
        }, {})

        // if there is no service information for this age grp
        // we can bail out here.
        if (!Object.keys(feeTypes).length) {
          return null
        }

        return [type, feeTypes] as const
      })
      .filter(Boolean)
      .reduce(
        (acc, [type, feeTypes]) => ({
          ...acc,
          [type]: feeTypes,
        }),
        {}
      )

    return fees
  })

  // if at anypoint we returned null, we jsut want to have a record why
  if (!content) {
    await page.screenshot({
      fullPage: true,
      path: p.join(__dirname, `../errors/${path.split('/').join('-')}.png`),
    })
  }

  return content
}

export default async function main() {
  const b = await launch()
  const page = await b.newPage()
  try {
    await runCentre(
      page,
      '/service/nsw/2016/redfern/forever+green+montessori+++/3282573993'
    )
  } catch (e) {
    console.warn(e)
  }
  await page.close()
  return b.close()
}
