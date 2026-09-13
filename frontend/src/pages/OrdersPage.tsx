import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ordersApi, unwrapList } from '@/services/shop'
import { formatPrice, cn } from '@/utils/format'
import type { Order } from '@/types'

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const

export function OrdersPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })
  const orders = unwrapList(data || []) as Order[]

  if (isLoading) return <div className="p-10">{t('common.loading')}</div>
  if (!orders.length) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-4xl">{t('orders.empty')}</p>
        <Link to="/products" className="mt-6 inline-block underline">
          {t('cart.continue')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <h1 className="font-display text-5xl tracking-wide">{t('orders.title')}</h1>
      <div className="mt-8 space-y-4">
        {orders.map((o) => (
          <Link key={o.id} to={`/orders/${o.order_number}`} className="block border border-line p-5 transition hover:border-accent dark:border-[#333]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{o.order_number}</span>
              <span className="text-sm text-accent">{t(`status.${o.status}`)}</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              {new Date(o.created_at).toLocaleString()} · {formatPrice(o.total_price)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.detail(id),
    enabled: !!id,
  })
  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(id),
    onSuccess: () => {
      toast.success(t('orders.cancelledOk'))
      qc.invalidateQueries({ queryKey: ['order', id] })
    },
  })

  if (isLoading || !order) return <div className="p-10">{t('common.loading')}</div>

  const stepIdx = STEPS.indexOf(order.status as (typeof STEPS)[number])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">{t('orders.track')}</p>
      <h1 className="font-display text-5xl tracking-wide">{order.order_number}</h1>

      {order.status !== 'cancelled' && (
        <div className="mt-10 flex items-center justify-between gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center">
              <div className={cn('h-3 w-3 rounded-full', i <= stepIdx ? 'bg-accent' : 'bg-line dark:bg-[#333]')} />
              <p className={cn('mt-2 text-center text-[10px] uppercase tracking-wider', i <= stepIdx ? 'text-accent' : 'text-muted')}>
                {t(`status.${s}`)}
              </p>
              {i < STEPS.length - 1 && (
                <div className="pointer-events-none absolute hidden" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 space-y-3 border-t border-line pt-6 dark:border-[#333]">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.product_name} · {item.size}/{item.color} ×{item.quantity}
            </span>
            <span>{formatPrice(item.subtotal)}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-1 text-sm">
        <p>
          {order.first_name} {order.last_name} · {order.phone}
        </p>
        <p className="text-muted">
          {order.city}, {order.address}
        </p>
        <p>
          {t('checkout.payment')}: {order.payment_method}
        </p>
        <p className="text-lg font-semibold">{formatPrice(order.total_price)}</p>
      </div>
      {['pending', 'confirmed'].includes(order.status) && (
        <button type="button" onClick={() => cancel.mutate()} className="mt-8 border px-4 py-2 text-sm">
          {t('orders.cancel')}
        </button>
      )}
    </div>
  )
}
