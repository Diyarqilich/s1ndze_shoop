import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types'

interface RecentState {
  items: Product[]
  add: (p: Product) => void
}

export const useRecentStore = create<RecentState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p) => {
        const rest = get().items.filter((x) => x.id !== p.id)
        set({ items: [p, ...rest].slice(0, 8) })
      },
    }),
    { name: 's1ndze-recent' },
  ),
)
