import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { favoritesApi, unwrapList } from '@/services/shop'
import { ProductCard } from '@/components/ProductCard'
import { useAuthStore } from '@/store/authStore'

export function FavoritesPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.list,
    enabled: !!user,
  })
  const items = unwrapList(data || []) as { id: number; product: import('@/types').Product }[]

  if (!user) {
    return (
      <div className="py-24 text-center">
        <Link to="/login" className="text-accent underline">
          {t('nav.login')}
        </Link>
      </div>
    )
  }

  if (isLoading) return <div className="p-10">{t('common.loading')}</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <h1 className="font-display text-5xl tracking-wide">{t('favorites.title')}</h1>
      {!items.length ? (
        <div className="py-20 text-center">
          <p className="text-muted">{t('favorites.empty')}</p>
          <Link to="/products" className="mt-4 inline-block underline">
            {t('cart.continue')}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((f) => (
            <ProductCard key={f.id} product={f.product} />
          ))}
        </div>
      )}
    </div>
  )
}
