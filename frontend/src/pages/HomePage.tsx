import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Shirt,
  Handbag,
  Baby,
  Footprints,
  Watch,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react'
import { ProductCard, ProductSkeleton } from '@/components/ProductCard'
import { categoriesApi, productsApi } from '@/services/shop'
import { useRecentStore } from '@/store/recentStore'

const CAT_ICON: Record<string, LucideIcon> = {
  men: Shirt,
  women: Handbag,
  kids: Baby,
  shoes: Footprints,
  accessories: Watch,
}

const CAT_GRADIENT: Record<string, string> = {
  men: 'from-sky-500/15 to-sky-500/0 text-sky-600 dark:text-sky-400',
  women: 'from-rose-500/15 to-rose-500/0 text-rose-600 dark:text-rose-400',
  kids: 'from-amber-500/15 to-amber-500/0 text-amber-600 dark:text-amber-400',
  shoes: 'from-emerald-500/15 to-emerald-500/0 text-emerald-600 dark:text-emerald-400',
  accessories: 'from-violet-500/15 to-violet-500/0 text-violet-600 dark:text-violet-400',
}

export function HomePage() {
  const { t } = useTranslation()
  const recent = useRecentStore((s) => s.items)
  const { data: home, isLoading } = useQuery({ queryKey: ['home'], queryFn: productsApi.home })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })

  return (
    <div className="bg-bg pb-10 dark:bg-[#0d0d0d]">
      {/* Compact marketplace banner — no big logo */}
      <section className="mx-auto max-w-7xl px-3 pt-4 sm:px-4 lg:px-6">
        <div className="anim-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink via-[#161616] to-[#0a0a0a] text-white shadow-lg shadow-black/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.14),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_100%,rgba(255,255,255,0.08),transparent_40%)]" />
          <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-10">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                {t('hero.promo')}
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                {t('hero.title')}
              </h1>
              <p className="mt-3 max-w-lg text-sm text-white/75 sm:text-base">{t('hero.subtitle')}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
                >
                  {t('hero.shop')}
                </Link>
                <Link
                  to="/products?sale=true"
                  className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/10"
                >
                  {t('hero.explore')}
                </Link>
              </div>
            </div>
            <div className="hidden grid-cols-2 gap-3 md:grid">
              {(home?.sale || []).slice(0, 4).map((p, i) => (
                <Link
                  key={p.id}
                  to={`/products/${p.slug}`}
                  className="anim-fade-up group overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-sm"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {p.main_image && (
                    <img
                      src={p.main_image}
                      alt={p.name}
                      className="aspect-square w-full object-cover opacity-95 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="mx-auto mt-4 grid max-w-7xl grid-cols-1 gap-2 px-3 sm:grid-cols-3 sm:px-4 lg:px-6">
        {[
          { icon: Truck, text: t('hero.delivery') },
          { icon: ShieldCheck, text: t('footer.payments') },
          { icon: RotateCcw, text: t('footer.returns') },
        ].map(({ icon: Icon, text }, i) => (
          <div
            key={text}
            className="anim-fade-up flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-sm dark:border-[#232323] dark:bg-[#171717]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg dark:bg-[#222]">
              <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
            </span>
            <span className="text-sm text-muted">{text}</span>
          </div>
        ))}
      </section>

      {/* Categories like marketplace chips/cards */}
      <section className="mx-auto mt-8 max-w-7xl px-3 sm:px-4 lg:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="relative pl-3 text-xl font-bold sm:text-2xl before:absolute before:left-0 before:top-1 before:h-5 before:w-1 before:rounded-full before:bg-ink before:content-[''] dark:before:bg-white">
            {t('sections.categories')}
          </h2>
          <Link
            to="/products"
            className="flex items-center gap-1 text-sm text-muted transition hover:text-ink dark:hover:text-white"
          >
            {t('sections.viewAll')} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
          {(categories || []).map((c, i) => {
            const Icon = CAT_ICON[c.slug] || ShoppingBag
            const gradient = CAT_GRADIENT[c.slug] || 'from-ink/10 to-ink/0 text-ink dark:text-white'
            return (
              <Link
                key={c.id}
                to={`/products?category=${c.slug}`}
                className="card-lift anim-fade-up group flex flex-col items-center gap-2.5 rounded-2xl border border-line bg-white p-4 text-center shadow-sm dark:border-[#232323] dark:bg-[#171717]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${gradient} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-medium">{c.name}</span>
              </Link>
            )
          })}
        </div>
      </section>

      <ProductRail title={t('sections.sale')} products={home?.sale} loading={isLoading} to="/products?sale=true" />
      <ProductRail title={t('sections.new')} products={home?.new_arrivals} loading={isLoading} to="/products?new=true" />
      <ProductRail title={t('sections.trending')} products={home?.trending} loading={isLoading} to="/products" />
      <ProductRail title={t('sections.featured')} products={home?.featured} loading={isLoading} to="/products?featured=true" />
      {recent.length > 0 && <ProductRail title={t('sections.recent')} products={recent} />}
    </div>
  )
}

function ProductRail({
  title,
  products,
  loading,
  to = '/products',
}: {
  title: string
  products?: import('@/types').Product[]
  loading?: boolean
  to?: string
}) {
  const { t } = useTranslation()
  // Don't render a header with an empty shelf underneath it — that's what
  // produced the tall dead-space gaps between section titles on the home page.
  if (!loading && !(products && products.length > 0)) return null
  return (
    <section className="mx-auto mt-10 max-w-7xl px-3 sm:px-4 lg:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="relative pl-3 text-xl font-bold sm:text-2xl before:absolute before:left-0 before:top-1 before:h-5 before:w-1 before:rounded-full before:bg-ink before:content-[''] dark:before:bg-white">
          {title}
        </h2>
        <Link to={to} className="flex items-center gap-1 text-sm text-muted transition hover:text-ink dark:hover:text-white">
          {t('sections.viewAll')} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
          : (products || []).slice(0, 8).map((p, i) => (
              <div key={p.id} className="anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </section>
  )
}
