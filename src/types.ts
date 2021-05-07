export interface Locality {
  suburb: string
  id: string
  postcode: string
}

export interface CentreData extends Locality {
  title: string
  id: string
  link: string
}
