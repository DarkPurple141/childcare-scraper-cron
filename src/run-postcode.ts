import type { Page } from 'puppeteer-core'
import { BASE_URL } from './constants'
import type { CentreData, Locality } from './types'

/**
 * Generates the list of ids / urls of childcare centres for a specified postcode
 *
 * @param page
 * @param locality
 * @returns
 */
export async function runPostcode(page: Page, locality: Locality) {
  const url = `${BASE_URL}/search/${locality.state}/${locality.postcode}/${locality.id}`

  await page.goto(url, { waitUntil: 'networkidle2' })

  const returnVal: CentreData[] = []

  while (1) {
    const content = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.result__box'))
        .filter(Boolean)
        .map((node) => {
          // this is the most unsafe, but more or less guaranteed to be
          // on the page
          // TODO remove non-null assertions
          const titleNode = node.querySelector('h2')!
          const title = titleNode.querySelector('a')!.textContent!.trim()
          const id = titleNode.id
          const link = node
            .querySelector('a[title="Organisation Details"]')!
            .getAttribute('href')!

          return {
            title,
            id,
            link,
          }
        })
    })

    // append results
    returnVal.push(
      ...content.map((item) => ({
        ...item,
        state: locality.state,
        suburb: locality.suburb,
        postcode: locality.postcode,
      }))
    )

    // click next arrow item, as long as not disabled
    const next = await page.$('a[title="Next"] i.icon-arrow-right')

    // can occur for non paginated results
    if (!next) {
      break
    }

    // if we've toggled through all pages the last arrow should be disabled
    const isLast = await next.evaluate((node) => {
      return node.closest('a')?.classList.contains('arrow-disabled')
    })

    if (isLast) {
      break
    }

    await next.click()
  }

  return returnVal
}
