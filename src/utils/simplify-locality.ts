import { toTitleCase } from './to-title-case'
import type { Locality } from '../types'

export function simplifyLocality({
  l: locality,
  p: postcode,
  s: state,
}: {
  l: string
  p: string
  s: string
}): Locality {
  return {
    suburb: toTitleCase(locality.toLowerCase()),
    postcode,
    state: state.toLowerCase(),
    id: locality.toLowerCase(),
  }
}
