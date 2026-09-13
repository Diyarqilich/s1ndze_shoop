import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import api from '@/services/api'

interface AuthState {
  user: User | null
  access: string | null
  refresh: string | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: User | null) => void
  login: (username: string, password: string) => Promise<void>
  register: (payload: Record<string, string>) => Promise<void>
  fetchMe: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access: null,
      refresh: null,
      setTokens: (access, refresh) => set({ access, refresh }),
      setUser: (user) => set({ user }),
      login: async (username, password) => {
        const { data } = await api.post('/auth/login/', { username, password })
        set({ access: data.access, refresh: data.refresh })
        await get().fetchMe()
      },
      register: async (payload) => {
        const { data } = await api.post('/auth/register/', payload)
        set({ access: data.access, refresh: data.refresh, user: data.user })
      },
      fetchMe: async () => {
        const { data } = await api.get('/auth/me/')
        set({ user: data })
      },
      logout: async () => {
        const refresh = get().refresh
        try {
          if (refresh) await api.post('/auth/logout/', { refresh })
        } catch {
          /* ignore */
        }
        set({ user: null, access: null, refresh: null })
      },
    }),
    { name: 's1ndze-auth' },
  ),
)
