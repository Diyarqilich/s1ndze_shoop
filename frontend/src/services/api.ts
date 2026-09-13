import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().access
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = useAuthStore.getState().refresh
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh })
          useAuthStore.getState().setTokens(data.access, data.refresh || refresh)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          useAuthStore.getState().logout()
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api

/**
 * Backend errors (see common/exceptions.py) come back shaped as:
 * { error: true, status_code, message, details: { field: [msg, ...] } | { detail } }
 * This pulls out the most specific, human-readable message available.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response
    const data = response?.data as
      | { message?: string; details?: Record<string, unknown> }
      | undefined
    if (data?.details && typeof data.details === 'object') {
      for (const value of Object.values(data.details)) {
        if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
        if (typeof value === 'string') return value
      }
    }
    if (typeof data?.message === 'string') return data.message
  }
  return fallback
}

/** Maps backend field-level validation errors onto a react-hook-form field map. */
export function getFieldErrors(error: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response
    const data = response?.data as { details?: Record<string, unknown> } | undefined
    if (data?.details && typeof data.details === 'object') {
      for (const [key, value] of Object.entries(data.details)) {
        if (Array.isArray(value) && typeof value[0] === 'string') out[key] = value[0]
        else if (typeof value === 'string') out[key] = value
      }
    }
  }
  return out
}
