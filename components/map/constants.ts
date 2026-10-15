import type { EventFormData, LocationFormData, SportType } from './types'

export const MAP_ID = 'DEMO_MAP_ID'
export const USER_STORAGE_KEY = 'userId'

export const MAP_DEFAULT_CENTER = {
  lat: 48.4647,
  lng: 35.0462,
}

export const MAP_DEFAULT_ZOOM = 13

export const SPORT_LABELS: Record<SportType, string> = {
  FOOTBALL: 'Футбол',
  BASKETBALL: 'Баскетбол',
  VOLLEYBALL: 'Волейбол',
  OTHER: 'Інше',
}

export const EMPTY_LOCATION_FORM: LocationFormData = {
  name: '',
  address: '',
  openingTime: '08:00',
  closingTime: '19:00',
  entryFee: '0',
  contactInfo: '',
  sportType: 'FOOTBALL',
}

export const EMPTY_EVENT_FORM: EventFormData = {
  title: '',
  note: '',
  date: '',
  startTime: '18:00',
  endTime: '19:30',
  maxParticipants: '10',
  sportType: 'FOOTBALL',
}
