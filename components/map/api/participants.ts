import { api } from './axios'

export async function joinEvent(eventId: number, userId: number): Promise<void> {
  await api.post(`/api/events/${eventId}/participants`, {
    userId,
  })
}

export async function leaveEvent(eventId: number, userId: number): Promise<void> {
  await api.delete(`/api/events/${eventId}/participants/${userId}`)
}
