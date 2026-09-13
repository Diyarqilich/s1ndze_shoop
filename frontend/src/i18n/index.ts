import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ru from './locales/ru.json'
import uz from './locales/uz.json'

const saved = localStorage.getItem('s1ndze-ui')
let lng = 'uz'
try {
  lng = saved ? JSON.parse(saved).state?.lang || 'uz' : 'uz'
} catch {
  lng = 'uz'
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    uz: { translation: uz },
  },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18n
