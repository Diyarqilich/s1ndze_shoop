import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center anim-fade-up">
      <p className="text-7xl font-extrabold">404</p>
      <p className="mt-2 text-muted">{t('common.notFound')}</p>
      <Link to="/" className="mt-8 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-ink">
        {t('common.backHome')}
      </Link>
    </div>
  )
}
