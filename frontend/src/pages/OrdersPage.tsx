import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ChevronRight,
  CreditCard,
  MapPin,
  Package,
  PackageSearch,
  Phone,
  XCircle,
} from 'lucide-react'
import { ordersApi, unwrapList } from '@/services/shop'
import { getErrorMessage } from '@/services/api'
import { formatPrice, cn } from '@/utils/format'
import type { Order } from '@/types'

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  confirmed: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  processing: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  shipped: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  delivered: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-sale/10 text-sale',
}

function paymentLabel(t: (k: string) => string, method: string) {
  // Click / Payme / Uzcard / Humo are actual service names and stay as-is
  // in every language; "cash" is a plain word and needs translating.
  return method === 'cash' ? t('checkout.cash') : method.toUpperCase()
}

export function OrdersPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })
  const orders = unwrapList(data || []) as Order[]

  if (isLoading) return <div className="p-10">{t('common.loading')}</div>
  if (!orders.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center text-muted">
        <PackageSearch className="h-12 w-12 opacity-40" />
        <p className="font-display text-3xl text-ink dark:text-white">{t('orders.empty')}</p>
        <Link to="/products" className="mt-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-soft dark:bg-white dark:text-ink">
          {t('cart.continue')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <h1 className="font-display text-4xl tracking-wide sm:text-5xl">{t('orders.title')}</h1>
      <div className="mt-8 space-y-3">
        {orders.map((o) => (
          <Link
            key={o.id}
            to={`/orders/${o.order_number}`}
            className="card-lift group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-accent dark:border-[#242424] dark:bg-[#171717]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg dark:bg-[#222]">
              <Package className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{o.order_number}</span>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_COLOR[o.status] || 'bg-line text-muted')}>
                  {t(`status.${o.status}`)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {new Date(o.created_at).toLocaleDateString()} · {formatPrice(o.total_price)}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
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
    onError: (err) => toast.error(getErrorMessage(err, t('common.error'))),
  })

  if (isLoading || !order) return <div className="p-10">{t('common.loading')}</div>

  const stepIdx = STEPS.indexOf(order.status as (typeof STEPS)[number])
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">{t('orders.track')}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">{order.order_number}</h1>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', STATUS_COLOR[order.status] || 'bg-line text-muted')}>
          {t(`status.${order.status}`)}
        </span>
      </div>

      {isCancelled ? (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-sale/30 bg-sale/5 p-4 text-sm text-sale">
          <XCircle className="h-5 w-5 shrink-0" />
          {t('status.cancelled')}
        </div>
      ) : (
        <div className="mt-10 flex items-center justify-between gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="relative flex flex-1 flex-col items-center">
              {i > 0 && (
                <div
                  className={cn(
                    'absolute right-1/2 top-[7px] h-0.5 w-full -translate-y-1/2',
                    i <= stepIdx ? 'bg-accent' : 'bg-line dark:bg-[#333]',
                  )}
                />
              )}
              <div className={cn('relative z-10 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#0d0d0d]', i <= stepIdx ? 'bg-accent' : 'bg-line dark:bg-[#333]')} />
              <p className={cn('mt-2 text-center text-[10px] uppercase tracking-wider', i <= stepIdx ? 'font-semibold text-accent' : 'text-muted')}>
                {t(`status.${s}`)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 space-y-3 rounded-2xl border border-line p-5 dark:border-[#242424]">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="font-medium">{item.product_name}</span>
              <span className="text-muted"> · {item.size}/{item.color} ×{item.quantity}</span>
            </span>
            <span className="shrink-0 font-medium">{formatPrice(item.subtotal)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-line pt-3 text-base font-semibold dark:border-[#242424]">
          <span>{t('cart.total')}</span>
          <span>{formatPrice(order.total_price)}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-line p-5 text-sm dark:border-[#242424] sm:grid-cols-2">
        <div className="flex items-start gap-2.5">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <span>
            {order.first_name} {order.last_name}
            <br />
            <span className="text-muted">{order.phone}</span>
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <span className="text-muted">
            {order.city}, {order.address}
          </span>
        </div>
        <div className="flex items-center gap-2.5 sm:col-span-2">
          <CreditCard className="h-4 w-4 shrink-0 text-muted" />
          <span className="text-muted">
            {t('checkout.payment')}: <span className="font-medium text-ink dark:text-white">{paymentLabel(t, order.payment_method)}</span>
          </span>
        </div>
      </div>

      {['pending', 'confirmed'].includes(order.status) && (
        <button
          type="button"
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-sale transition hover:border-sale disabled:opacity-50 dark:border-[#333]"
        >
          <XCircle className="h-4 w-4" />
          {t('orders.cancel')}
        </button>
      )}
    </div>
  )
}
