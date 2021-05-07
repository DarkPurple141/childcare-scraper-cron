import { Page } from 'puppeteer'
import { baseUrl } from './constants'
import { CentreData, Locality } from './types'

export async function runPostcode(page: Page, locality: Locality) {
  const url = `${baseUrl}/search/nsw/${locality.postcode}/${locality.id}`

  await page.goto(url, { waitUntil: 'networkidle2' })

  const returnVal: CentreData[] = []

  while (1) {
    const content = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.result__box')).map(
        (node) => {
          const titleNode = node.querySelector('h2')
          const title = titleNode.querySelector('a').textContent.trim()
          const id = titleNode.id
          const link = node
            .querySelector('a[title="Organisation Details"]')
            .getAttribute('href')

          return {
            title,
            id,
            link,
          }
        }
      )
    })

    // append results
    returnVal.push(
      ...content.map((item) => ({
        ...item,
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

    const isLast = await next.evaluate((node) => {
      return node.closest('a').classList.contains('arrow-disabled')
    })

    if (isLast) {
      break
    }

    await next.click()
  }

  return returnVal
}
