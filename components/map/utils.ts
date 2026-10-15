import type { Coordinates, SportEvent } from './types'

export function normalizeCoordinates(latitude: unknown, longitude: unknown): Coordinates | null {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    latitude === '' ||
    longitude === ''
  ) {
    return null
  }

  const lat = typeof latitude === 'number' ? latitude : Number(latitude)
  const lng = typeof longitude === 'number' ? longitude : Number(longitude)

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null
  }

  return { latitude: lat, longitude: lng }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Дату не вказано'

  const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]

  if (datePart) {
    const [year, month, day] = datePart.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return 'Некоректна дата'
    }

    return new Intl.DateTimeFormat('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Некоректна дата'
  }

  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '--:--'

  const match = value.match(/(?:T|\s)?(\d{2}):(\d{2})/)

  return match ? `${match[1]}:${match[2]}` : '--:--'
}

export function toLocalDateTime(date: string, time: string): string {
  return `${date}T${time}:00`
}

export function sortEvents(events: SportEvent[]): SportEvent[] {
  return [...events].sort((a, b) =>
    String(a.startsAt ?? '').localeCompare(String(b.startsAt ?? '')),
  )
}

export function getNextId<T extends { id: number }>(items: T[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

export function isFutureDateTime(value: string): boolean {
  const timestamp = new Date(value).getTime()

  return Number.isFinite(timestamp) && timestamp > Date.now()
}
