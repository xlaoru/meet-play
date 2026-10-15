export type SportType = 'FOOTBALL' | 'BASKETBALL' | 'VOLLEYBALL' | 'OTHER'

export type UserProfile = {
  id: number
  name: string
  age: number
  telegramUsername: string
  createdAt: string
}

export type SportLocation = {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  openingTime: string
  closingTime: string
  entryFee: number
  contactInfo: string | null
  creatorId?: number
  sportType: SportType
}

export type SportEvent = {
  id: number
  title: string
  note: string
  sportType: SportType
  startsAt: string
  endsAt: string
  maxParticipants: number
  locationId: number
  organizerId: number
  participantIds: number[]
}

export type LocationFormData = {
  name: string
  address: string
  openingTime: string
  closingTime: string
  entryFee: string
  contactInfo: string
  sportType: SportType
}

export type EventFormData = {
  title: string
  note: string
  date: string
  startTime: string
  endTime: string
  maxParticipants: string
  sportType: SportType
}

export type PanelMode = 'details' | 'create-location' | 'create-event' | null

export type Coordinates = {
  latitude: number
  longitude: number
}

export type FieldChange<T> = <K extends keyof T>(field: K, value: T[K]) => void
