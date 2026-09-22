import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ImageOff,
  ImagePlus,
  Loader2,
  Package,
  PackagePlus,
  PackageSearch,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Wallet,
} from 'lucide-react'
import { categoriesApi, sellerApi, unwrapList } from '@/services/shop'
import { getErrorMessage } from '@/services/api'
import { formatPrice, cn } from '@/utils/format'
import type { Product } from '@/types'
import { useEffect, useMemo, useState } from 'react'

export function SellerDashboard() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useQuery({ queryKey: ['seller-stats'], queryFn: sellerApi.stats })

  const cards = [
    { label: t('seller.products'), value: stats?.total_products, icon: Package },
    { label: t('seller.active'), value: stats?.active_products, icon: CheckCircle2 },
    { label: t('seller.orders'), value: stats?.total_orders, icon: ShoppingCart },
    { label: t('seller.pending'), value: stats?.pending_orders, icon: Clock },
    { label: t('status.delivered'), value: stats?.delivered_orders, icon: PackageSearch },
    { label: t('seller.revenue'), value: stats?.revenue != null ? formatPrice(stats.revenue) : undefined, icon: Wallet },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">{t('seller.dashboard')}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/seller/products" className="rounded-xl border border-line px-4 py-2 text-sm font-medium transition hover:border-ink dark:border-[#333] dark:hover:border-white">
            {t('seller.products')}
          </Link>
          <Link to="/seller/products/create" className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-soft">
            <PackagePlus className="h-4 w-4" />
            {t('seller.create')}
          </Link>
          <Link to="/seller/orders" className="rounded-xl border border-line px-4 py-2 text-sm font-medium transition hover:border-ink dark:border-[#333] dark:hover:border-white">
            {t('seller.orders')}
          </Link>
        </div>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-6 shadow-sm dark:border-[#242424] dark:bg-[#171717]">
            <div className="flex items-center gap-2 text-muted">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <p className="text-xs uppercase tracking-[0.2em]">{label}</p>
            </div>
            <p className="mt-3 font-display text-4xl">{isLoading ? '—' : (value ?? '—')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SellerProductsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const { data, isLoading } = useQuery({ queryKey: ['seller-products'], queryFn: sellerApi.products })
  const products = unwrapList(data || []) as Product[]
  const filtered = q ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : products

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">{t('seller.products')}</h1>
        <Link to="/seller/products/create" className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-soft">
          <PackagePlus className="h-4 w-4" />
          {t('seller.create')}
        </Link>
      </div>

      {products.length > 0 && (
        <div className="relative mb-6 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('seller.searchPlaceholder')}
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-ink dark:border-[#333] dark:bg-[#171717]"
          />
        </div>
      )}

      {!products.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-20 text-center text-muted dark:border-[#333]">
          <Package className="h-10 w-10 opacity-40" />
          <p>{t('seller.noProducts')}</p>
          <Link to="/seller/products/create" className="text-sm font-semibold text-accent hover:underline">
            {t('seller.create')}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line dark:border-[#242424]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-xs uppercase tracking-wider text-muted dark:border-[#242424] dark:bg-[#161616]">
                <th className="px-4 py-3">{t('seller.name')}</th>
                <th className="px-4 py-3">{t('seller.price')}</th>
                <th className="px-4 py-3">{t('seller.status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 dark:border-[#242424]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.main_image ? (
                        <img src={p.main_image} alt="" className="h-12 w-10 rounded-md object-cover" />
                      ) : (
                        <span className="flex h-12 w-10 items-center justify-center rounded-md bg-bg dark:bg-[#222]">
                          <ImageOff className="h-4 w-4 text-muted" />
                        </span>
                      )}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        p.is_available
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-line text-muted dark:bg-[#2a2a2a]',
                      )}
                    >
                      {p.is_available ? t('seller.active') : t('seller.off')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link to={`/seller/products/${p.id}/edit`} className="text-sm font-medium underline-offset-2 hover:underline">
                        {t('seller.edit')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(t('admin.confirmDeleteProduct'))) remove.mutate(p.id)
                        }}
                        className="text-sm font-medium text-sale hover:underline"
                      >
                        {t('seller.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {q && !filtered.length && (
            <p className="p-6 text-center text-sm text-muted">{t('common.noResults')}</p>
          )}
        </div>
      )}
    </div>
  )
}

type VariantRow = { key: string; size: string; color: string; stock: string }

let rowKeySeq = 0
function newRow(size = 'M', color = 'Black', stock = '10'): VariantRow {
  rowKeySeq += 1
  return { key: `row-${rowKeySeq}`, size, color, stock }
}

type ExistingImage = { id: number; image: string; is_main: boolean }

type ProductFormValues = {
  name: string
  description: string
  price: string
  old_price: string
  category: string
  brand: string
  material: string
  is_available: boolean
}

const emptyFormValues: ProductFormValues = {
  name: '',
  description: '',
  price: '',
  old_price: '',
  category: '',
  brand: 'S1NDZE',
  material: '',
  is_available: true,
}

export function SellerProductFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const [variantRows, setVariantRows] = useState<VariantRow[]>([newRow()])
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
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
    reset({
      name: existing.name,
      description: existing.description || '',
      price: existing.price,
      old_price: existing.old_price || '',
      category: String(existing.category),
      brand: existing.brand,
      material: existing.material || '',
      is_available: existing.is_available,
    })
    if (existing.variants?.length) {
      setVariantRows(existing.variants.map((v) => newRow(v.size, v.color, String(v.stock))))
    }
    setExistingImages((existing.images || []).map((i) => ({ id: i.id, image: i.image, is_main: i.is_main })))
  }, [existing, reset])

  const pendingPreviews = useMemo(() => pendingFiles.map((f) => URL.createObjectURL(f)), [pendingFiles])
  useEffect(() => () => pendingPreviews.forEach((url) => URL.revokeObjectURL(url)), [pendingPreviews])

  const addVariantRow = () => setVariantRows((rows) => [...rows, newRow()])
  const removeVariantRow = (key: string) =>
    setVariantRows((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows))
  const updateVariantRow = (key: string, field: 'size' | 'color' | 'stock', value: string) =>
    setVariantRows((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)))

  const deleteExistingImage = useMutation({
    mutationFn: (imageId: number) => sellerApi.deleteImage(Number(id), imageId),
    onSuccess: (_data, imageId) => {
      setExistingImages((imgs) => imgs.filter((i) => i.id !== imageId))
      toast.success(t('seller.imageRemoved'))
    },
    onError: (err) => toast.error(getErrorMessage(err, t('common.error'))),
  })

  const buildPayload = (values: ProductFormValues) => ({
    name: values.name,
    description: values.description,
    price: values.price,
    old_price: values.old_price || null,
    category: Number(values.category),
    brand: values.brand,
    material: values.material,
    is_available: values.is_available,
    is_new: !isEdit,
    variants: variantRows.map((r) => ({ size: r.size, color: r.color, stock: Number(r.stock) || 0 })),
  })

  const save = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = buildPayload(values)
      const product = isEdit ? await sellerApi.update(Number(id), payload) : await sellerApi.create(payload)
      // Let the backend decide which photo is "main": it auto-picks the
      // first image a product ever gets, so uploading in order with
      // is_main left false here just appends the rest as gallery shots.
      for (const file of pendingFiles) {
        await sellerApi.uploadImage(product.id, file)
      }
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
    toast.error(t('seller.formErrors'))
  }

  const onFilesPicked = (files: FileList | null) => {
    if (!files?.length) return
    setPendingFiles((prev) => [...prev, ...Array.from(files)])
  }

  if (isEdit && loadingExisting) return <div className="p-10">{t('common.loading')}</div>

  const inputCls = 'w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none transition focus:border-accent dark:border-[#333] dark:bg-[#171717]'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
          {isEdit ? t('seller.editProduct') : t('seller.create')}
        </h1>
        <Link
          to="/seller/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('orders.cancel')}
        </Link>
      </div>

      {!isEdit && categories && flatCats.length === 0 && (
        <p className="mb-4 rounded-xl border border-sale/40 bg-sale/5 px-4 py-3 text-sm text-sale">
          {t('seller.noCategories')}
        </p>
      )}

      <form onSubmit={handleSubmit((d) => save.mutate(d), onInvalid)} className="space-y-8" noValidate>
        <section className="space-y-4 rounded-2xl border border-line p-5 dark:border-[#242424]">
          <div>
            <input {...register('name', { required: true })} placeholder={`${t('seller.name')} *`} className={inputCls} />
            {errors.name && <p className="mt-1 pl-1 text-xs text-sale">{t('auth.errRequired')}</p>}
          </div>
          <div>
            <textarea {...register('description', { required: true })} placeholder={`${t('product.description')} *`} rows={4} className={inputCls} />
            {errors.description && <p className="mt-1 pl-1 text-xs text-sale">{t('auth.errRequired')}</p>}
          </div>
          <div>
            <select {...register('category', { required: true })} className={inputCls}>
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
              <input {...register('price', { required: true })} placeholder={`${t('seller.price')} *`} inputMode="decimal" className={inputCls} />
              {errors.price && <p className="mt-1 pl-1 text-xs text-sale">{t('auth.errRequired')}</p>}
            </div>
            <input {...register('old_price')} placeholder={t('seller.oldPrice')} inputMode="decimal" className={inputCls} />
          </div>
          <input {...register('material')} placeholder={t('product.material')} className={inputCls} />
          {isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('is_available')} className="h-4 w-4 accent-accent" />
              {t('seller.active')}
            </label>
          )}
        </section>

        <section className="rounded-2xl border border-line p-5 dark:border-[#242424]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted">{t('seller.variants')}</h2>
            <button
              type="button"
              onClick={addVariantRow}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold transition hover:border-accent hover:text-accent dark:border-[#333]"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('seller.addVariant')}
            </button>
          </div>
          <div className="space-y-2">
            {variantRows.map((row) => (
              <div key={row.key} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                <input
                  value={row.size}
                  onChange={(e) => updateVariantRow(row.key, 'size', e.target.value)}
                  placeholder={t('product.size')}
                  className={inputCls}
                />
                <input
                  value={row.color}
                  onChange={(e) => updateVariantRow(row.key, 'color', e.target.value)}
                  placeholder={t('product.color')}
                  className={inputCls}
                />
                <input
                  value={row.stock}
                  onChange={(e) => updateVariantRow(row.key, 'stock', e.target.value)}
                  placeholder={t('product.stock')}
                  inputMode="numeric"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => removeVariantRow(row.key)}
                  disabled={variantRows.length === 1}
                  aria-label={t('aria.removeVariant')}
                  className="rounded-lg p-2.5 text-muted transition hover:bg-sale/10 hover:text-sale disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line p-5 dark:border-[#242424]">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-muted">{t('seller.images')}</h2>
          {!existingImages.length && !pendingFiles.length && (
            <p className="mb-4 text-sm text-muted">{t('seller.noImages')}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {existingImages.map((img) => (
              <div key={img.id} className="group relative h-24 w-20 overflow-hidden rounded-lg border border-line dark:border-[#333]">
                <img src={img.image} alt="" className="h-full w-full object-cover" />
                {img.is_main && (
                  <span className="absolute left-1 top-1 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {t('seller.mainImage')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => deleteExistingImage.mutate(img.id)}
                  aria-label={t('aria.removeImage')}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {pendingFiles.map((file, i) => (
              <div key={`${file.name}-${i}`} className="group relative h-24 w-20 overflow-hidden rounded-lg border border-accent/50">
                <img src={pendingPreviews[i]} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPendingFiles((files) => files.filter((_, idx) => idx !== i))}
                  aria-label={t('aria.removeImage')}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-muted transition hover:border-accent hover:text-accent dark:border-[#333]">
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t('seller.addImage')}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFilesPicked(e.target.files)} />
            </label>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={save.isPending || (!isEdit && !!categories && flatCats.length === 0)}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-ink"
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('profile.save')}
          </button>
          <Link to="/seller/products" className="rounded-xl border border-line px-6 py-3 text-sm font-medium transition hover:border-ink dark:border-[#333] dark:hover:border-white">
            {t('orders.cancel')}
          </Link>
        </div>
      </form>
    </div>
  )
}

export function SellerOrdersPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: ['seller-orders'], queryFn: sellerApi.orders })
  const orders = (data || []) as import('@/types').Order[]

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    confirmed: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    processing: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    shipped: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    delivered: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    cancelled: 'bg-sale/10 text-sale',
  }

  if (isLoading) return <div className="p-10">{t('common.loading')}</div>

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
      <h1 className="font-display text-4xl">{t('seller.orders')}</h1>
      {!orders.length ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-20 text-center text-muted dark:border-[#333]">
          <ShoppingCart className="h-10 w-10 opacity-40" />
          <p>{t('seller.emptyOrders')}</p>
          <p className="text-sm">{t('seller.emptyOrdersHint')}</p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-2xl border border-line p-4 dark:border-[#242424]">
              <div>
                <span className="font-medium">{o.order_number}</span>
                <p className="mt-1 text-sm text-muted">{formatPrice(o.total_price)}</p>
              </div>
              <span className={cn('rounded-full px-3 py-1 text-xs font-medium', statusColor[o.status] || 'bg-line text-muted')}>
                {t(`status.${o.status}`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
