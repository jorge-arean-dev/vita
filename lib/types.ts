// Types for the sample job view components

export interface Job {
  id: number
  companyName: string
  companyLogoUrl?: string
  creationDate: string
  jobTitle: string
  commitment: string[]
  rate: {
    value: number
    basis: string
  }
  locationRequirement: string
  locationDetail: string
  isSaved: boolean
}