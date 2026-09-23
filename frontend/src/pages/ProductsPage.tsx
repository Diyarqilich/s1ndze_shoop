import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ChevronDown, PackageSearch, SlidersHorizontal, Tag, X } from 'lucide-react'
import { ProductCard, ProductSkeleton } from '@/components/ProductCard'
import { categoriesApi, productsApi } from '@/services/shop'
import { cn, categoryLabel } from '@/utils/format'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function ProductsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [drawer, setDrawer] = useState(false)

  const query = useMemo(() => {
    const o: Record<string, string> = {}
    ;['search', 'category', 'brand', 'gender', 'size', 'color', 'min_price', 'max_price', 'ordering', 'page'].forEach(
      (k) => {
        const v = params.get(k)
        if (v) o[k] = v
      },
    )
    if (params.get('sale') === 'true') o.sale = 'true'
    if (params.get('new') === 'true') o.new = 'true'
    if (params.get('featured') === 'true') o.featured = 'true'
    return o
  }, [params])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', query],
    queryFn: () => productsApi.list(query),
  })
  const { data: categoriesFlat } = useQuery({ queryKey: ['categories-flat'], queryFn: categoriesApi.flat })
  // Department names (Men/Women/Kids) read as a gender picker by another
  // name, so the catalog never surfaces them as a filter — only the
  // product-type categories (T-Shirts, Hoodies, Shoes, Accessories, ...).
  const categories = useMemo(
    () => (categoriesFlat || []).filter((c) => !['men', 'women', 'kids'].includes(c.slug)),
    [categoriesFlat],
  )

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    setParams(next)
  }

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = []
    const categorySlug = params.get('category')
    if (categorySlug) {
      const cat = (categories || []).find((c) => c.slug === categorySlug)
      chips.push({ key: 'category', label: cat ? categoryLabel(t, cat.slug, cat.name) : categorySlug })
    }
    if (params.get('size')) chips.push({ key: 'size', label: `${t('common.size')}: ${params.get('size')}` })
    if (params.get('min_price') || params.get('max_price')) {
      chips.push({
        key: 'price',
        label: `${params.get('min_price') || '0'} — ${params.get('max_price') || '∞'}`,
      })
    }
    if (params.get('sale') === 'true') chips.push({ key: 'sale', label: t('common.sale') })
    if (params.get('new') === 'true') chips.push({ key: 'new', label: t('common.new') })
    return chips
  }, [params, categories, t])

  const clearChip = (key: string) => {
    if (key === 'price') {
      const next = new URLSearchParams(params)
      next.delete('min_price')
      next.delete('max_price')
      next.delete('page')
      setParams(next)
    } else {
      set(key, '')
    }
  }

  const clearAll = () => setParams(new URLSearchParams())

  const Filters = (
    <div className="space-y-7">
      <FilterSection title={t('nav.categories')}>
        <div className="flex flex-col gap-1">
          {(categories || []).map((c) => {
            const active = params.get('category') === c.slug
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => set('category', active ? '' : c.slug)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
                  active
                    ? 'bg-ink font-semibold text-white dark:bg-white dark:text-ink'
                    : 'text-ink/80 hover:bg-bg dark:text-white/80 dark:hover:bg-[#1e1e1e]',
                )}
              >
                {categoryLabel(t, c.slug, c.name)}
              </button>
            )
          })}
        </div>
      </FilterSection>

      <FilterSection title={t('common.size')}>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const active = params.get('size') === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => set('size', active ? '' : s)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition-all',
                  active
                    ? 'border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink'
                    : 'border-line hover:border-ink/40 dark:border-[#333] dark:hover:border-white/40',
                )}
              >
                {s}
              </button>
            )
          })}
        </div>
      </FilterSection>

      <FilterSection title={t('common.priceRange')}>
        <div className="flex items-center gap-2">
          <input
            placeholder={t('common.min')}
            inputMode="numeric"
            defaultValue={params.get('min_price') || ''}
            onBlur={(e) => set('min_price', e.target.value)}
            className="w-full rounded-lg border border-line bg-transparent px-2.5 py-2 text-sm outline-none transition focus:border-ink dark:border-[#333] dark:focus:border-white"
          />
          <span className="text-muted">—</span>
          <input
            placeholder={t('common.max')}
            inputMode="numeric"
            defaultValue={params.get('max_price') || ''}
            onBlur={(e) => set('max_price', e.target.value)}
            className="w-full rounded-lg border border-line bg-transparent px-2.5 py-2 text-sm outline-none transition focus:border-ink dark:border-[#333] dark:focus:border-white"
          />
        </div>
      </FilterSection>

      <div className="flex flex-col gap-3 border-t border-line pt-5 dark:border-[#2a2a2a]">
        <ToggleRow
          label={t('common.sale')}
          checked={params.get('sale') === 'true'}
          onChange={(v) => set('sale', v ? 'true' : '')}
        />
        <ToggleRow
          label={t('common.new')}
          checked={params.get('new') === 'true'}
          onChange={(v) => set('new', v ? 'true' : '')}
        />
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 anim-fade-up">
        <div>
          <h1 className="font-display text-2xl tracking-wide sm:text-3xl">{t('nav.shop')}</h1>
          <p className="mt-1 text-sm text-muted">
            {data?.count ?? 0} {t('common.items')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2.5 text-sm font-medium transition hover:border-ink dark:border-[#333] dark:hover:border-white lg:hidden"
            onClick={() => setDrawer(true)}
          >
            <SlidersHorizontal className="h-4 w-4" /> {t('common.filters')}
            {activeChips.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">
                {activeChips.length}
              </span>
            )}
          </button>
          <div className="relative">
            <select
              value={params.get('ordering') || 'newest'}
              onChange={(e) => set('ordering', e.target.value)}
              className="appearance-none rounded-xl border border-line bg-white py-2.5 pl-3.5 pr-9 text-sm outline-none transition hover:border-ink/40 focus:border-ink dark:border-[#333] dark:bg-[#171717] dark:hover:border-white/40 dark:focus:border-white"
            >
              <option value="newest">{t('common.newest')}</option>
              <option value="oldest">{t('common.oldest')}</option>
              <option value="price_asc">{t('common.priceAsc')}</option>
              <option value="price_desc">{t('common.priceDesc')}</option>
              <option value="popular">{t('common.popular')}</option>
              <option value="discount">{t('common.discount')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          </div>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2 anim-fade-in">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => clearChip(chip.key)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium transition hover:border-ink dark:border-[#333] dark:bg-[#171717] dark:hover:border-white"
            >
              <Tag className="h-3 w-3 text-muted" />
              {chip.label}
              <X className="h-3 w-3 text-muted transition group-hover:text-sale" />
            </button>
          ))}
          <button onClick={clearAll} className="text-xs font-semibold text-muted underline-offset-2 transition hover:text-sale hover:underline">
            {t('common.clearAll')}
          </button>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden anim-fade-up lg:block">
          <div className="sticky top-24 rounded-2xl border border-line/70 bg-white/60 p-5 dark:border-[#242424] dark:bg-[#161616]/60">
            {Filters}
          </div>
        </aside>
        <div>
          {isError && (
            <div className="flex flex-col items-center gap-3 py-24 text-center anim-fade-in">
              <AlertCircle className="h-10 w-10 text-sale" />
              <p className="text-muted">{t('common.error')}</p>
              <button
                onClick={() => refetch()}
                className="rounded-xl bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-soft dark:bg-white dark:text-ink"
              >
                {t('common.retry')}
              </button>
            </div>
          )}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : !data?.results?.length ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center text-muted anim-fade-in">
              <PackageSearch className="h-12 w-12 opacity-40" />
              <p>{t('common.noResults')}</p>
              {activeChips.length > 0 && (
                <button onClick={clearAll} className="text-sm font-semibold text-ink underline-offset-4 hover:underline dark:text-white">
                  {t('common.clearAll')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
              {data.results.map((p, i) => (
                <div key={p.id} className="stagger-item" style={{ '--stagger': i % 12 } as React.CSSProperties}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
          {data && data.count > 12 && (
            <div className="mt-12 flex justify-center gap-2">
              <button
                disabled={!data.previous}
                onClick={() => set('page', String(Math.max(1, Number(params.get('page') || 1) - 1)))}
                className="rounded-xl border border-line px-4 py-2 text-sm font-medium transition hover:border-ink disabled:opacity-40 disabled:hover:border-line dark:border-[#333] dark:hover:border-white"
              >
                {t('common.prev')}
              </button>
              <button
                disabled={!data.next}
                onClick={() => set('page', String(Number(params.get('page') || 1) + 1))}
                className="rounded-xl border border-line px-4 py-2 text-sm font-medium transition hover:border-ink disabled:opacity-40 disabled:hover:border-line dark:border-[#333] dark:hover:border-white"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 anim-fade-in bg-black/50 lg:hidden" onClick={() => setDrawer(false)}>
          <div
            className="absolute right-0 h-full w-80 max-w-[85vw] anim-slide-in overflow-y-auto bg-paper p-6 dark:bg-[#111]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-2xl">{t('common.filters')}</h3>
              <button onClick={() => setDrawer(false)} className="rounded-lg p-1.5 hover:bg-bg dark:hover:bg-[#222]">
                <X />
              </button>
            </div>
            {Filters}
            <button
              onClick={() => setDrawer(false)}
              className="mt-8 w-full rounded-xl bg-ink py-3 text-sm font-semibold uppercase tracking-widest text-white dark:bg-white dark:text-ink"
            >
              {t('common.applyFilters')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted">{title}</h3>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-ink dark:bg-white' : 'bg-line dark:bg-[#333]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform dark:bg-[#111]',
            checked ? 'left-0.5 translate-x-[18px]' : 'left-0.5',
          )}
        />
      </button>
    </label>
  )
}
