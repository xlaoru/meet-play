import type { UserProfile } from '../types'
import { api } from './axios'

export type CreateUserPayload = {
  name: string
  age: number
  telegramUsername: string
}

export async function createUser(payload: CreateUserPayload): Promise<UserProfile> {
  const { data } = await api.post<UserProfile>('/api/users', payload)

  return data
}
