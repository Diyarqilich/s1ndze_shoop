import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '@/i18n'

type Theme = 'light' | 'dark'

interface UiState {
  theme: Theme
  lang: string
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  setLang: (l: string) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      lang: 'uz',
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
      },
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        get().setTheme(next)
      },
      setLang: (lang) => {
        void i18n.changeLanguage(lang)
        set({ lang })
      },
    }),
    { name: 's1ndze-ui' },
  ),
)

export function applyStoredTheme() {
  const theme = useUiStore.getState().theme
  document.documentElement.classList.toggle('dark', theme === 'dark')
}
