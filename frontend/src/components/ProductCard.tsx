import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Eye, Heart, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Product } from '@/types'
import { formatPrice, cn } from '@/utils/format'
import { useAuthStore } from '@/store/authStore'
import { favoritesApi } from '@/services/shop'
import { getErrorMessage } from '@/services/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Props {
  product: Product
}

export function ProductCard({ product }: Props) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [favorited, setFavorited] = useState(!!product.is_favorited)
  // Products refetch often (rails, catalog pages, favorites list) and this
  // card doesn't always remount when that happens. Adjust local state
  // during render (React's recommended pattern) rather than in an effect,
  // so it never lags a frame behind the server's latest value.
  const [prevServerFavorited, setPrevServerFavorited] = useState(product.is_favorited)
  if (product.is_favorited !== prevServerFavorited) {
    setPrevServerFavorited(product.is_favorited)
    setFavorited(!!product.is_favorited)
  }

  const toggleFav = useMutation({
    mutationFn: (wasFavorited: boolean) =>
      wasFavorited ? favoritesApi.removeByProduct(product.id) : favoritesApi.add(product.id),
    onSuccess: (_data, wasFavorited) => {
      toast.success(wasFavorited ? t('favorites.removed') : t('favorites.added'), {
        icon: <Heart className="h-4 w-4 fill-current" />,
      })
      qc.invalidateQueries({ queryKey: ['favorites'] })
    },
    onError: (err, wasFavorited) => {
      setFavorited(wasFavorited)
      toast.error(getErrorMessage(err, t('common.error')))
    },
  })

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error(t('auth.loginToContinue'))
      return
    }
    const wasFavorited = favorited
    setFavorited(!wasFavorited)
    toggleFav.mutate(wasFavorited)
  }

  return (
    <article className="card-lift group relative overflow-hidden rounded-2xl border border-line/60 bg-white shadow-sm dark:border-[#242424] dark:bg-[#171717]">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#f0f0f0] dark:bg-[#222]">
          {product.main_image ? (
            <img
              src={product.main_image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-lg tracking-widest text-muted">
              S1NDZE
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.is_sale && product.discount_percent > 0 && (
              <span className="animate-[fadeIn_0.3s_ease] rounded-md bg-sale px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                -{product.discount_percent}%
              </span>
            )}
            {product.is_new && (
              <span className="rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm dark:bg-white dark:text-ink">
                {t('seller.newBadge')}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute right-2 top-2 rounded-full bg-white/95 p-2 opacity-100 shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 dark:bg-[#111]/95 dark:hover:bg-[#111]"
            aria-label={favorited ? t('aria.removeFavorite') : t('aria.addFavorite')}
            aria-pressed={favorited}
          >
            <Heart
              key={String(favorited)}
              className={cn(
                'h-4 w-4 transition-colors',
                favorited ? 'anim-heart-pop fill-accent text-accent' : 'text-ink/70 group-hover:text-accent dark:text-white/70',
              )}
            />
          </button>

          <div className="absolute inset-x-2 bottom-2 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex hidden">
            <span className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/95 py-2 text-xs font-semibold text-ink shadow-md backdrop-blur dark:bg-[#111]/95 dark:text-white">
              <Eye className="h-3.5 w-3.5" />
              {t('product.quickView')}
            </span>
          </div>
        </div>
      </Link>

      <div className="space-y-1.5 p-3.5">
        <p className="text-[11px] uppercase tracking-wide text-muted">{product.brand}</p>
        <Link
          to={`/products/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug transition-colors hover:text-accent"
        >
          {product.name}
        </Link>
        {product.reviews_count > 0 && (
          <p className="flex items-center gap-1 text-xs text-muted">
            <Star className="h-3 w-3 fill-current text-amber-400" />
            {product.average_rating} · {product.reviews_count}
          </p>
        )}
        <div className="flex flex-wrap items-baseline gap-2 pt-1">
          <span className="text-base font-bold">{formatPrice(product.price)}</span>
          {product.old_price && (
            <span className="text-xs text-muted line-through">{formatPrice(product.old_price)}</span>
          )}
        </div>
      </div>
    </article>
  )
}

export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line/60 bg-white shadow-sm dark:border-[#242424] dark:bg-[#171717]">
      <div className="skeleton-shimmer aspect-[3/4]" />
      <div className="space-y-2 p-3.5">
        <div className="skeleton-shimmer h-3 w-1/3 rounded" />
        <div className="skeleton-shimmer h-4 w-4/5 rounded" />
        <div className="skeleton-shimmer h-5 w-1/2 rounded" />
      </div>
    </div>
  )
}
