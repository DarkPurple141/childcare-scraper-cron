import { RefObject, useCallback, useRef } from 'react'

function chunk<T>(arr: T[], n: number) {
  return arr.reduce(
    (chunk, val) => {
      if (chunk[chunk.length - 1].length === n) chunk.push([])

      chunk[chunk.length - 1].push(val)

      return chunk
    },
    [[] as T[]]
  )
}
async function fetchPostcode(): Promise<any[]> {
  const data = await fetch('/api/postcode', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.NEXT_PUBLIC_KEY}`,
    },
  }).then((res) => res.json())

  return data
}

async function fetchCentre(body: string): Promise<any[]> {
  const data = await fetch('/api/centre', {
    method: 'POST',
    body,
    headers: {
      authorization: `Bearer ${process.env.NEXT_PUBLIC_KEY}`,
    },
  }).then((res) => res.json())

  return data
}
const set = new Set()

const App = () => {
  const ref: RefObject<HTMLDivElement> | null = useRef(null)

  const onClick = useCallback(async () => {
    const data = await fetchPostcode()
    const centresToScrape = data.filter((item: any) => !set.has(item.id))
    centresToScrape.forEach(item => set.add(item.id))

    const $el = ref.current!

    const chunked = chunk(centresToScrape, 5)

    chunked.forEach(chunk => {
      fetchCentre(JSON.stringify(chunk)).then(data => {
        data.forEach(item => {
          $el.textContent += `${JSON.stringify(item)}\n`
        })
      })
    })
  }, [])

  return (
    <div>
      <button onClick={onClick}>Start</button>
      <div style={{ whiteSpace: 'pre' }} ref={ref}></div>
    </div>
  )
}

export default App
