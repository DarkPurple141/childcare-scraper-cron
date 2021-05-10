export interface Locality {
  suburb: string
  id: string
  postcode: string
}

export interface Fees {
  '0 - 12 Months Old'?: Record<string, string>
  '13 - 24 Months Old'?: Record<string, string>
  '25 - 35 Months Old'?: Record<string, string>
  '36 Months Old - Preschool Age'?: Record<string, string>
}

export interface CentreData extends Locality {
  title: string
  id: string
  link: string
  fees?: Fees
}
