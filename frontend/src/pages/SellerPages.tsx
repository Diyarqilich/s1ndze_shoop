import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { categoriesApi, sellerApi, unwrapList } from '@/services/shop'
import { getErrorMessage } from '@/services/api'
import { formatPrice } from '@/utils/format'
import type { Product } from '@/types'
import { useEffect, useState } from 'react'

export function SellerDashboard() {
  const { t } = useTranslation()
  const { data: stats } = useQuery({ queryKey: ['seller-stats'], queryFn: sellerApi.stats })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl tracking-wide">{t('seller.dashboard')}</h1>
        <div className="flex gap-3 text-sm uppercase tracking-widest">
          <Link to="/seller/products" className="hover:text-accent">
            {t('seller.products')}
          </Link>
          <Link to="/seller/products/create" className="hover:text-accent">
            {t('seller.create')}
          </Link>
          <Link to="/seller/orders" className="hover:text-accent">
            {t('seller.orders')}
          </Link>
        </div>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          [t('seller.products'), stats?.total_products],
          [t('seller.active'), stats?.active_products],
          [t('seller.orders'), stats?.total_orders],
          [t('seller.pending'), stats?.pending_orders],
          [t('status.delivered'), stats?.delivered_orders],
          [t('seller.revenue'), stats?.revenue != null ? formatPrice(stats.revenue) : '—'],
        ].map(([label, value]) => (
          <div key={String(label)} className="border border-line p-6 dark:border-[#333]">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
            <p className="mt-3 font-display text-4xl">{value ?? '—'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SellerProductsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['seller-products'], queryFn: sellerApi.products })
  const products = unwrapList(data || []) as Product[]
  const remove = useMutation({
    mutationFn: (id: number) => sellerApi.remove(id),
    onSuccess: () => {
      toast.success(t('seller.deleted'))
      qc.invalidateQueries({ queryKey: ['seller-products'] })
    },
    onError: (err) => toast.error(getErrorMessage(err, t('common.error'))),
  })

  if (isLoading) return <div className="p-10">{t('common.loading')}</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-4xl">{t('seller.products')}</h1>
        <Link to="/seller/products/create" className="bg-accent px-4 py-2 text-sm uppercase tracking-widest text-white">
          {t('seller.create')}
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wider text-muted">
              <th className="py-3">{t('seller.name')}</th>
              <th>{t('seller.price')}</th>
              <th>{t('seller.status')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line dark:border-[#333]">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    {p.main_image && <img src={p.main_image} alt="" className="h-12 w-10 object-cover" />}
                    <span>{p.name}</span>
                  </div>
                </td>
                <td>{formatPrice(p.price)}</td>
                <td>{p.is_available ? t('seller.active') : t('seller.off')}</td>
                <td className="space-x-2 text-right">
                  <Link to={`/seller/products/${p.id}/edit`} className="underline">
                    {t('seller.edit')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('admin.confirmDeleteProduct'))) remove.mutate(p.id)
                    }}
                    className="text-sale"
                  >
                    {t('seller.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type ProductFormValues = {
  name: string
  description: string
  price: string
  old_price: string
  category: string
  brand: string
  gender: string
  material: string
  size: string
  color: string
  stock: string
  is_available: boolean
}

const emptyFormValues: ProductFormValues = {
  name: '',
  description: '',
  price: '',
  old_price: '',
  category: '',
  brand: 'S1NDZE',
  gender: 'unisex',
  material: '',
  size: 'M',
  color: 'Black',
  stock: '10',
  is_available: true,
}

export function SellerProductFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const [file, setFile] = useState<File | null>(null)
  const { data: categories } = useQuery({ queryKey: ['categories-flat'], queryFn: categoriesApi.list })
  const flatCats = (categories || []).flatMap((c) => [c, ...(c.children || [])])

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['seller-product', id],
    queryFn: () => sellerApi.detail(Number(id)),
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormValues>({
    defaultValues: emptyFormValues,
  })

  useEffect(() => {
    if (!existing) return
    const firstVariant = existing.variants?.[0]
    reset({
      name: existing.name,
      description: existing.description || '',
      price: existing.price,
      old_price: existing.old_price || '',
      category: String(existing.category),
      brand: existing.brand,
      gender: existing.gender,
      material: existing.material || '',
      size: firstVariant?.size || 'M',
      color: firstVariant?.color || 'Black',
      stock: String(firstVariant?.stock ?? 10),
      is_available: existing.is_available,
    })
  }, [existing, reset])

  const buildPayload = (values: ProductFormValues) => ({
    name: values.name,
    description: values.description,
    price: values.price,
    old_price: values.old_price || null,
    category: Number(values.category),
    brand: values.brand,
    gender: values.gender,
    material: values.material,
    is_available: values.is_available,
    is_new: !isEdit,
    variants: [{ size: values.size, color: values.color, stock: Number(values.stock) }],
  })

  const save = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = buildPayload(values)
      const product = isEdit ? await sellerApi.update(Number(id), payload) : await sellerApi.create(payload)
      if (file) await sellerApi.uploadImage(product.id, file)
      return product
    },
    onSuccess: () => {
      toast.success(isEdit ? t('seller.updated') : t('seller.created'))
      qc.invalidateQueries({ queryKey: ['seller-products'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['seller-product', id] })
      navigate('/seller/products')
    },
    onError: (err) => toast.error(getErrorMessage(err, t('common.error'))),
  })

  const onInvalid = () => {
    // The form used to fail silently when a required field (most often the
    // category dropdown) was left empty — handleSubmit just refused to fire
    // with no feedback at all, which looked like "adding a product does
    // nothing". Surface it clearly instead.
    toast.error(t('seller.formErrors'))
  }

  if (isEdit && loadingExisting) return <div className="p-10">{t('common.loading')}</div>

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 lg:px-6">
      <h1 className="text-3xl font-bold">{isEdit ? t('seller.editProduct') : t('seller.create')}</h1>
      {!isEdit && categories && flatCats.length === 0 && (
        <p className="mt-4 rounded-xl border border-sale/40 bg-sale/5 px-4 py-3 text-sm text-sale">
          {t('seller.noCategories')}
        </p>
      )}
      <form onSubmit={handleSubmit((d) => save.mutate(d), onInvalid)} className="mt-8 space-y-4" noValidate>
        <div>
          <input {...register('name', { required: true })} placeholder={`${t('seller.name')} *`} className="w-full rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" />
          {errors.name && <p className="mt-1 pl-1 text-xs text-sale">{t('auth.errRequired')}</p>}
        </div>
        <div>
          <textarea {...register('description', { required: true })} placeholder={`${t('product.description')} *`} rows={4} className="w-full rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" />
          {errors.description && <p className="mt-1 pl-1 text-xs text-sale">{t('auth.errRequired')}</p>}
        </div>
        <div>
          <select {...register('category', { required: true })} className="w-full rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]">
            <option value="">{t('seller.category')} *</option>
            {flatCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 pl-1 text-xs text-sale">{t('seller.selectCategory')}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input {...register('price', { required: true })} placeholder={`${t('seller.price')} *`} inputMode="decimal" className="w-full rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" />
            {errors.price && <p className="mt-1 pl-1 text-xs text-sale">{t('auth.errRequired')}</p>}
          </div>
          <input {...register('old_price')} placeholder={t('seller.oldPrice')} inputMode="decimal" className="rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input {...register('size')} placeholder={t('product.size')} className="rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" />
          <input {...register('color', { required: true })} placeholder={`${t('product.color')} *`} className="rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" />
          <input {...register('stock')} placeholder={t('product.stock')} inputMode="numeric" className="rounded-xl border border-line bg-white px-3 py-3 dark:border-[#333] dark:bg-[#171717]" />
        </div>
        {isEdit && existing?.main_image && !file && (
          <img src={existing.main_image} alt="" className="h-24 w-20 rounded-lg object-cover" />
        )}
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {isEdit && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('is_available')} />
            {t('seller.active')}
          </label>
        )}
        <button
          type="submit"
          disabled={save.isPending || (!isEdit && !!categories && flatCats.length === 0)}
          className="rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-ink"
        >
          {t('profile.save')}
        </button>
      </form>
    </div>
  )
}

export function SellerOrdersPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: ['seller-orders'], queryFn: sellerApi.orders })
  const orders = (data || []) as import('@/types').Order[]

  if (isLoading) return <div className="p-10">{t('common.loading')}</div>

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
      <h1 className="font-display text-4xl">{t('seller.orders')}</h1>
      <div className="mt-8 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="border border-line p-4 dark:border-[#333]">
            <div className="flex justify-between">
              <span className="font-medium">{o.order_number}</span>
              <span className="text-accent">{t(`status.${o.status}`)}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{formatPrice(o.total_price)}</p>
          </div>
        ))}
        {!orders.length && <p className="text-muted">{t('seller.emptyOrders')}</p>}
      </div>
    </div>
  )
}
