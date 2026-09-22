import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Heart, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi, reviewsApi, cartApi, favoritesApi, unwrapList } from '@/services/shop'
import { getErrorMessage } from '@/services/api'
import { formatPrice, cn } from '@/utils/format'
import { ProductCard } from '@/components/ProductCard'
import { useRecentStore } from '@/store/recentStore'
import { useAuthStore } from '@/store/authStore'

const SIZE_GUIDE = [
  { size: 'XS', chest: '86-90', waist: '70-74' },
  { size: 'S', chest: '90-94', waist: '74-78' },
  { size: 'M', chest: '94-98', waist: '78-82' },
  { size: 'L', chest: '98-102', waist: '82-86' },
  { size: 'XL', chest: '102-106', waist: '86-90' },
  { size: 'XXL', chest: '106-112', waist: '90-96' },
]

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const addRecent = useRecentStore((s) => s.add)
  const qc = useQueryClient()
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [qty, setQty] = useState(1)
  const [showGuide, setShowGuide] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.detail(slug),
    enabled: !!slug,
  })
  const { data: related } = useQuery({
    queryKey: ['related', slug],
    queryFn: () => productsApi.related(slug),
    enabled: !!slug,
  })
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', slug],
    queryFn: () => reviewsApi.list(slug),
    enabled: !!slug,
  })
  const reviews = unwrapList(reviewsData || [])

  useEffect(() => {
    if (product) addRecent(product)
  }, [product, addRecent])

  const variants = product?.variants || []
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))], [variants])
  const colors = useMemo(() => {
    const filtered = size ? variants.filter((v) => v.size === size) : variants
    return [...new Set(filtered.map((v) => v.color))]
  }, [variants, size])

  const selected = variants.find((v) => v.size === size && v.color === color)

  const [favorited, setFavorited] = useState(false)
  const [prevServerFavorited, setPrevServerFavorited] = useState(product?.is_favorited)
  if (product?.is_favorited !== prevServerFavorited) {
    setPrevServerFavorited(product?.is_favorited)
    setFavorited(!!product?.is_favorited)
  }

  useEffect(() => {
    if (sizes.length && !size) setSize(sizes[0])
  }, [sizes, size])
  useEffect(() => {
    if (colors.length && !colors.includes(color)) setColor(colors[0] || '')
  }, [colors, color])

  const addMut = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error('Select variant')
      return cartApi.add(selected.id, qty)
    },
    onSuccess: () => {
      toast.success(t('product.addToCart'))
      qc.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || (user ? t('common.error') : t('nav.login')))
    },
  })

  const toggleFavMut = useMutation({
    mutationFn: (wasFavorited: boolean) =>
      wasFavorited ? favoritesApi.removeByProduct(product!.id) : favoritesApi.add(product!.id),
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

  const handleFavoriteClick = () => {
    if (!user) {
      toast.error(t('auth.loginToContinue'))
      return
    }
    const wasFavorited = favorited
    setFavorited(!wasFavorited)
    toggleFavMut.mutate(wasFavorited)
  }

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-20">{t('common.loading')}</div>
  if (!product) return <div className="py-20 text-center">404</div>

  const images = product.images?.length
    ? product.images.map((i) => i.image)
    : product.main_image
      ? [product.main_image]
      : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-[3/4] overflow-hidden bg-[#ece8e3] dark:bg-[#1a1a1a]">
            {images[imgIdx] ? (
              <img src={images[imgIdx]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-6xl text-accent">S1</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((src, i) => (
                <button key={src} type="button" onClick={() => setImgIdx(i)} className={cn('h-20 w-16 overflow-hidden border', i === imgIdx && 'border-accent')}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted">{product.brand}</p>
          <h1 className="mt-2 font-display text-5xl tracking-wide">{product.name}</h1>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
            {product.old_price && <span className="text-muted line-through">{formatPrice(product.old_price)}</span>}
            {product.discount_percent > 0 && <span className="bg-accent px-2 py-0.5 text-xs text-white">-{product.discount_percent}%</span>}
          </div>
          {product.reviews_count > 0 && (
            <p className="mt-2 text-sm text-muted">
              {'★'.repeat(Math.round(product.average_rating))} {product.average_rating} · {product.reviews_count} {t('product.reviews')}
            </p>
          )}
          <p className="mt-6 text-sm leading-relaxed text-muted">{product.description}</p>

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em]">{t('product.size')}</p>
              <button type="button" className="text-xs underline" onClick={() => setShowGuide(true)}>
                {t('product.sizeGuide')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button key={s} type="button" onClick={() => setSize(s)} className={cn('min-w-12 border px-3 py-2 text-sm', size === s && 'border-accent bg-accent text-white')}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs uppercase tracking-[0.2em]">{t('product.color')}</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className={cn('border px-4 py-2 text-sm', color === c && 'border-accent text-accent')}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border">
              <button type="button" className="p-3" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center">{qty}</span>
              <button type="button" className="p-3" onClick={() => setQty((q) => q + 1)}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted">
              {selected ? (selected.stock > 0 ? `${t('product.stock')}: ${selected.stock}` : t('product.outOfStock')) : ''}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!selected || selected.stock < 1 || addMut.isPending}
              onClick={() => addMut.mutate()}
              className="bg-ink px-8 py-3 text-sm uppercase tracking-[0.18em] text-paper disabled:opacity-40 dark:bg-paper dark:text-ink"
            >
              {t('product.addToCart')}
            </button>
            <button
              type="button"
              disabled={!selected || selected.stock < 1}
              onClick={() =>
                addMut.mutate(undefined, {
                  onSuccess: () => navigate('/checkout'),
                })
              }
              className="border border-accent px-8 py-3 text-sm uppercase tracking-[0.18em] text-accent"
            >
              {t('product.buyNow')}
            </button>
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={cn(
                'border p-3 transition-colors',
                favorited ? 'border-accent bg-accent/10 text-accent' : 'border-line dark:border-[#333]',
              )}
              aria-label={favorited ? t('aria.removeFavorite') : t('aria.addFavorite')}
              aria-pressed={favorited}
            >
              <Heart key={String(favorited)} className={cn('h-5 w-5', favorited && 'anim-heart-pop fill-accent text-accent')} />
            </button>
          </div>

          <div className="mt-10 space-y-2 border-t border-line pt-6 text-sm dark:border-[#333]">
            <p>
              <span className="text-muted">{t('product.material')}:</span> {product.material || '—'}
            </p>
            <p>
              <span className="text-muted">{t('product.details')}:</span> {product.category_name}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-3xl tracking-wide">{t('product.reviews')}</h2>
        <div className="mt-6 space-y-4">
          {reviews.length === 0 && <p className="text-muted">{t('product.noReviews')}</p>}
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-line py-4 dark:border-[#333]">
              <p className="text-sm font-medium">
                {r.username} · {'★'.repeat(r.rating)}
              </p>
              <p className="mt-1 text-sm text-muted">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {related && related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-8 font-display text-3xl tracking-wide">{t('sections.related')}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowGuide(false)}>
          <div className="w-full max-w-md bg-paper p-6 dark:bg-ink" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-3xl">{t('product.sizeGuide')}</h3>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">{t('product.size')}</th>
                  <th>{t('product.sizeGuideChest')}</th>
                  <th>{t('product.sizeGuideWaist')}</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map((r) => (
                  <tr key={r.size} className="border-b border-line dark:border-[#333]">
                    <td className="py-2">{r.size}</td>
                    <td>{r.chest}</td>
                    <td>{r.waist}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="mt-4 text-sm underline" onClick={() => setShowGuide(false)}>
              {t('product.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
