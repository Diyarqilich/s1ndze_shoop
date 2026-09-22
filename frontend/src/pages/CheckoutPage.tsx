import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cartApi, couponsApi, ordersApi } from '@/services/shop'
import { formatPrice } from '@/utils/format'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(7),
  city: z.string().min(1),
  address: z.string().min(3),
  comment: z.string().optional(),
  payment_method: z.enum(['cash', 'click', 'payme', 'uzcard', 'humo']),
})

type Form = z.infer<typeof schema>

export function CheckoutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  const { data: cart, isLoading: cartLoading } = useQuery({ queryKey: ['cart'], queryFn: cartApi.get, enabled: !!user })

  // Redirecting is a side effect, not something to trigger mid-render —
  // and it must wait for the cart to actually finish loading, otherwise a
  // user who does have items gets briefly bounced back to /cart while the
  // query is still in flight.
  useEffect(() => {
    if (user && !orderNumber && !cartLoading && !cart?.items?.length) {
      navigate('/cart')
    }
  }, [user, orderNumber, cartLoading, cart, navigate])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone_number || '',
      payment_method: 'cash',
      city: 'Tashkent',
    },
  })

  const checkout = useMutation({
    mutationFn: (data: Form) =>
      ordersApi.checkout({
        ...data,
        comment: data.comment || '',
        coupon_code: coupon,
      }),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ['cart'] })
      setOrderNumber(order.order_number)
      toast.success(t('checkout.success'))
    },
    onError: (e: unknown) => {
      const d = (e as { response?: { data?: { details?: unknown; message?: string } } })?.response?.data
      toast.error(d?.message || JSON.stringify(d?.details) || t('common.error'))
    },
  })

  const applyCoupon = async () => {
    if (!cart) return
    try {
      const res = await couponsApi.validate(coupon, Number(cart.subtotal))
      setDiscount(Number(res.discount))
      toast.success(t('checkout.couponOk'))
    } catch {
      toast.error(t('checkout.couponBad'))
      setDiscount(0)
    }
  }

  if (!user) {
    return (
      <div className="py-24 text-center">
        <Link to="/login" className="text-accent underline">
          {t('nav.login')}
        </Link>
      </div>
    )
  }

  if (orderNumber) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">{t('checkout.success')}</p>
        <h1 className="mt-4 font-display text-5xl">{orderNumber}</h1>
        <p className="mt-4 text-muted">{t('checkout.trackHint')}</p>
        <Link to={`/orders/${orderNumber}`} className="mt-8 inline-block bg-ink px-6 py-3 text-sm uppercase tracking-widest text-paper dark:bg-paper dark:text-ink">
          {t('orders.track')}
        </Link>
      </div>
    )
  }

  if (!cart || cartLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center">{t('common.loading')}</div>
  }
  if (!cart.items.length) {
    return null
  }

  const delivery = Number(cart.subtotal) - discount >= 500000 ? 0 : 25000
  const total = Number(cart.subtotal) - discount + delivery

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1fr_360px] lg:px-6">
      <form onSubmit={handleSubmit((d) => checkout.mutate(d))} className="space-y-8">
        <h1 className="font-display text-5xl tracking-wide">{t('checkout.title')}</h1>
        <section>
          <h2 className="font-display text-2xl">{t('checkout.contact')}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input {...register('first_name')} placeholder={t('checkout.firstName')} className="rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" />
            <input {...register('last_name')} placeholder={t('checkout.lastName')} className="rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" />
            <input {...register('phone')} placeholder={t('checkout.phone')} className="rounded-xl border border-line bg-white px-3 py-3 sm:col-span-2 dark:border-[#333] dark:bg-[#171717]" />
          </div>
          {(errors.first_name || errors.last_name || errors.phone) && <p className="mt-2 text-sm text-sale">{t('checkout.fillContact')}</p>}
        </section>
        <section>
          <h2 className="text-xl font-bold">{t('checkout.delivery')}</h2>
          <div className="mt-4 grid gap-4">
            <input {...register('city')} placeholder={t('checkout.city')} className="rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" />
            <input {...register('address')} placeholder={t('checkout.address')} className="rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" />
            <textarea {...register('comment')} placeholder={t('checkout.comment')} className="rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" rows={3} />
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl">{t('checkout.payment')}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(['cash', 'click', 'payme', 'uzcard', 'humo'] as const).map((m) => (
              <label key={m} className="cursor-pointer border px-4 py-2 text-sm uppercase has-[:checked]:border-accent has-[:checked]:text-accent">
                <input type="radio" value={m} {...register('payment_method')} className="sr-only" />
                {m}
              </label>
            ))}
          </div>
        </section>
        <button type="submit" disabled={isSubmitting || checkout.isPending} className="bg-accent px-8 py-3 text-sm uppercase tracking-widest text-white disabled:opacity-50">
          {t('checkout.place')}
        </button>
      </form>

      <aside className="h-fit border border-line p-6 dark:border-[#333]">
        <h2 className="text-xl font-bold">{t('checkout.order')}</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cart.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span>
                {i.product.name} ×{i.quantity}
              </span>
              <span>{formatPrice(i.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder={t('checkout.coupon')} className="flex-1 border border-line bg-transparent px-2 py-2 text-sm dark:border-[#333]" />
          <button type="button" onClick={applyCoupon} className="border px-3 text-sm">
            {t('checkout.apply')}
          </button>
        </div>
        <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm dark:border-[#333]">
          <div className="flex justify-between">
            <span>{t('cart.subtotal')}</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('cart.discount')}</span>
            <span>-{formatPrice(discount)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('cart.delivery')}</span>
            <span>{formatPrice(delivery)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>{t('cart.total')}</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  )
}
