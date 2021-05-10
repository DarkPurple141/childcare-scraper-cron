import { Page, launch } from 'puppeteer'
import { baseUrl } from './constants'
import { logger } from './logger'
import type { Fees } from './types'

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
        const type = node.querySelector('h3')!.textContent
        const feeTypes = Array.from(
          node.querySelectorAll('.service__feesItem:first-of-type')
        ).reduce((acc, fee) => {
          // eg "After School Session": "$30.00",
          const nameNode = fee.querySelector('.service__feesItemName')
          const valueNode = fee.querySelector('.service__feesItemValue')

          if (nameNode && valueNode) {
            return {
              ...acc,
              [nameNode.textContent!]: valueNode.textContent!,
            }
          }

          return acc
        }, {})

        // if there is no service information for this age group
        // we can bail out here.
        if (!Object.keys(feeTypes).length) {
          return null
        }

        return [type, feeTypes] as const
      })
      .filter(Boolean)
      .reduce(
        // TODO
        // @ts-ignore
        (acc, [type, feeTypes]) => ({
          ...acc,
          [type]: feeTypes,
        }),
        {} as Fees
      )

    return fees
  })

  if (!content) {
    logger.warn(`[Missing CentreData] No fees detected for ${url}`)
  }

  return content
}

export default async function main() {
  const b = await launch()
  const page = await b.newPage()
  try {
    const result = await runCentre(
      page,
      '/service/nsw/2016/redfern/forever+green+montessori+++/3282573993'
    )
    logger.info(result)
  } catch (e) {
    logger.warn(e)
  }
  await page.close()
  return b.close()
}
