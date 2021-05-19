import { createWriteStream } from 'fs'
import { join } from 'path'

export function createWriter() {
  const stream = createWriteStream(join(__dirname, '../raw.json'), {
    flags: 'a',
  })

  return stream
}
