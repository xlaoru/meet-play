import axios from 'axios'

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Сталася помилка. Спробуйте ще раз.',
): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback
  }

  return fallback
}
