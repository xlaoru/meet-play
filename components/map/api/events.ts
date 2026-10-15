import type { SportEvent, SportType } from '../types'
import { api } from './axios'

export type CreateEventPayload = {
  title: string
  note: string
  sportType: SportType
  startsAt: string
  endsAt: string
  maxParticipants: number
  locationId: number
  organizerId: number
}

export type EventDetails = {
  id: number
  title: string
  note: string
  sportType: SportType
  startsAt: string
  endsAt: string
  maxParticipants: number
  participantsCount: number
  locationId: number
  locationName: string
  organizerName: string
  organizerTelegramUsername: string
}

export async function createEvent(payload: CreateEventPayload): Promise<SportEvent> {
  const { data } = await api.post<SportEvent>('/api/events', payload)

  return data
}

export async function getEventById(eventId: number): Promise<EventDetails> {
  const { data } = await api.get<EventDetails>(`/api/events/${eventId}`)

  return data
}
