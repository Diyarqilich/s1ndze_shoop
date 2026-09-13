import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { cartApi } from '@/services/shop'
import { formatPrice } from '@/utils/format'
import { useAuthStore } from '@/store/authStore'

export function CartPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    enabled: !!user,
  })

  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => cartApi.update(id, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  })
  const remove = useMutation({
    mutationFn: (id: number) => cartApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  })
  const clear = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  })

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-display text-4xl">{t('cart.title')}</p>
        <Link to="/login" className="mt-6 inline-block text-accent underline">
          {t('nav.login')}
        </Link>
      </div>
    )
  }

  if (isLoading) return <div className="p-10">{t('common.loading')}</div>
  if (!cart?.items?.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-display text-4xl">{t('cart.empty')}</p>
        <Link to="/products" className="mt-6 inline-block bg-ink px-6 py-3 text-sm uppercase tracking-widest text-paper dark:bg-paper dark:text-ink">
          {t('cart.continue')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1fr_320px] lg:px-6">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-5xl tracking-wide">{t('cart.title')}</h1>
          <button type="button" onClick={() => clear.mutate()} className="text-sm text-muted underline">
            {t('cart.clear')}
          </button>
        </div>
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-4 border-b border-line py-4 dark:border-[#333]">
              <Link to={`/products/${item.product.slug}`} className="h-28 w-24 shrink-0 overflow-hidden bg-[#ece8e3]">
                {item.product.main_image && <img src={item.product.main_image} alt="" className="h-full w-full object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col">
                <Link to={`/products/${item.product.slug}`} className="font-medium hover:text-accent">
                  {item.product.name}
                </Link>
                <p className="text-sm text-muted">
                  {item.variant_size} / {item.variant_color}
                </p>
                <p className="mt-1 text-sm">{formatPrice(item.price)}</p>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex items-center border">
                    <button type="button" className="p-2" onClick={() => update.mutate({ id: item.id, quantity: Math.max(1, item.quantity - 1) })}>
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button type="button" className="p-2" onClick={() => update.mutate({ id: item.id, quantity: item.quantity + 1 })}>
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button type="button" onClick={() => remove.mutate(item.id)} className="p-2 text-muted hover:text-accent">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="ml-auto font-medium">{formatPrice(item.subtotal)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside className="h-fit border border-line p-6 dark:border-[#333]">
        <h2 className="text-xl font-bold">{t('cart.summary')}</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{t('cart.subtotal')}</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          <p className="text-xs text-muted">{t('cart.freeDelivery')}</p>
        </div>
        <Link to="/checkout" className="mt-6 block bg-accent py-3 text-center text-sm uppercase tracking-widest text-white">
          {t('cart.checkout')}
        </Link>
        <Link to="/products" className="mt-3 block text-center text-sm underline">
          {t('cart.continue')}
        </Link>
      </aside>
    </div>
  )
}
