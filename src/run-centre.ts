import { Page } from 'puppeteer-core'
import logger from './logger'
import type { Fees } from './types'

export async function runCentre(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'networkidle2' })

  const contact = await page.evaluate(() => {
    const serviceNode = document.querySelector('.service__contact')

    if (!serviceNode) {
      return null
    }

    const phoneNode = serviceNode.querySelector('[href*="tel"]')
    const emailNode = serviceNode.querySelector('[href*="mailto"]')
    const addressNode = serviceNode.querySelector('.address')

    const email = emailNode ? emailNode.textContent?.trim() : undefined
    const phone = phoneNode ? phoneNode.textContent?.trim() : undefined
    const address = addressNode ? addressNode.textContent?.trim() : undefined

    return {
      email,
      phone,
      address,
    }
  })

  /**
   * Returns type of centre and whether there is _any_ vacancy
   */
  const meta = await page.evaluate(() => {
    const header = document.querySelector('.service__header')

    if (!header) {
      return {}
    }

    const isVacant = header.querySelector('.icon-vacancy-round')
    const type = header.querySelector('.h4')?.firstChild?.nodeValue

    return {
      type,
      vacancy: !!isVacant,
    }
  })

  const fees = await page.evaluate(() => {
    const parent = document.getElementById('acc-fees')
    if (!parent) {
      return null
    }

    const lastUpdatedFeesNode = parent.querySelector('.service__last-update')
    const lastUpdatedEntry: any = lastUpdatedFeesNode
      ? lastUpdatedFeesNode.textContent!.split(':').map((str) => str.trim())
      : []

    const feeGroups = Array.from(parent.querySelectorAll('.accordion__item'))

    if (!feeGroups.length) {
      return null
    }

    const feeEntries = feeGroups
      .map((node) => {
        const type = node.querySelector('h3')!.textContent
        const feeTypes = Array.from(
          node.querySelectorAll('.service__feesItem:first-of-type')
        ).reduce((acc, fee) => {
          // eg "After School Session": "$30.00",
          const nameNode = fee.querySelector('.service__feesItemName')
          const valueNode = fee.querySelector('.service__feesItemValue')

          if (nameNode && valueNode) {
            return Object.assign(acc, {
              [nameNode.textContent!]: valueNode.textContent!,
            })
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

    // @ts-ignore
    return Object.fromEntries(feeEntries.concat([lastUpdatedEntry])) as Fees
  })

  if (!fees) {
    logger.warn(`[Missing CentreData] No fees detected for ${url}`)
  }

  if (!contact) {
    logger.warn(`[Missing CentreData] No contact details detected for ${url}`)
  }

  return {
    fees,
    contact,
    meta,
  }
}
