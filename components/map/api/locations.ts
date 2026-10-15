import type { SportEvent, SportLocation } from '../types'
import { api } from './axios'

export type CreateLocationPayload = {
  name: string
  address: string
  latitude: number
  longitude: number
  openingTime: string
  closingTime: string
  entryFee: number
  contactInfo: string | null
  creatorId: number
  sportType: SportLocation['sportType']
}

export async function getLocations(): Promise<SportLocation[]> {
  const { data } = await api.get<SportLocation[]>('/api/locations')

  return data
}

export async function createLocation(payload: CreateLocationPayload): Promise<SportLocation> {
  const { data } = await api.post<SportLocation>('/api/locations', payload)

  return data
}

export async function getLocationEvents(locationId: number): Promise<SportEvent[]> {
  const { data } = await api.get<SportEvent[]>(`/api/locations/${locationId}/events`)

  return data
}
