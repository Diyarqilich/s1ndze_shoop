import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Bell,
  Heart,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sun,
  User,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import logo from '@/assets/s1ndze.jpg'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { cartApi, notificationsApi } from '@/services/shop'
import { cn } from '@/utils/format'
import { FlagIcon, type FlagCode } from '@/components/FlagIcon'

const langs: { code: FlagCode; label: string }[] = [
  { code: 'uz', label: 'UZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
]

export function Header() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggleTheme, setLang, lang } = useUiStore()

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    enabled: !!user,
  })
  const { data: unread } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationsApi.unread,
    enabled: !!user,
    refetchInterval: 60000,
  })

  useEffect(() => {
    i18n.changeLanguage(lang)
  }, [lang, i18n])

  const nav = [
    { to: '/', label: t('nav.home') },
    { to: '/products', label: t('nav.shop') },
    { to: '/products?new=true', label: t('nav.new') },
    { to: '/products?sale=true', label: t('nav.sale') },
  ]

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/products?search=${encodeURIComponent(q)}`)
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur dark:border-[#2a2a2a] dark:bg-[#111]/95">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 sm:px-4 lg:px-6">
        <button className="rounded-lg p-2 hover:bg-bg lg:hidden dark:hover:bg-[#222]" onClick={() => setOpen(true)} aria-label="menu">
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logo} alt="S1NDZE" className="h-8 w-auto object-contain" />
          <span className="hidden text-lg font-extrabold tracking-tight sm:inline">
            S1NDZE
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-bg dark:hover:bg-[#222]',
                  isActive && 'bg-bg dark:bg-[#222]',
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={onSearch} className="ml-auto hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('common.search')}
              className="w-full rounded-xl border border-line bg-bg py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-ink dark:border-[#333] dark:bg-[#1a1a1a]"
            />
          </div>
        </form>

        <div className="flex items-center gap-0.5 md:ml-2">
          <div className="hidden items-center rounded-xl bg-bg p-0.5 sm:flex dark:bg-[#1a1a1a]">
            {langs.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLang(l.code)
                  i18n.changeLanguage(l.code)
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition',
                  lang === l.code && 'bg-white shadow-sm dark:bg-[#333]',
                )}
                title={l.label}
              >
                <FlagIcon code={l.code} />
                {l.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={toggleTheme} aria-label="theme" className="rounded-lg p-2 hover:bg-bg dark:hover:bg-[#222]">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <Link to="/favorites" className="rounded-lg p-2 hover:bg-bg dark:hover:bg-[#222]" aria-label="favorites">
            <Heart className="h-5 w-5" />
          </Link>
          <Link to="/cart" className="relative rounded-lg p-2 hover:bg-bg dark:hover:bg-[#222]" aria-label="cart">
            <ShoppingBag className="h-5 w-5" />
            {!!cart?.items_count && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] text-white dark:bg-white dark:text-ink">
                {cart.items_count}
              </span>
            )}
          </Link>
          {user && (
            <Link to="/profile" className="relative rounded-lg p-2 hover:bg-bg dark:hover:bg-[#222]" aria-label="notifications">
              <Bell className="h-5 w-5" />
              {!!unread?.unread && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sale" />}
            </Link>
          )}
          {user ? (
            <div className="group relative">
              <Link to="/profile" className="flex items-center gap-1 rounded-lg p-2 hover:bg-bg dark:hover:bg-[#222]">
                <User className="h-5 w-5" />
              </Link>
              <div className="invisible absolute right-0 top-full z-50 min-w-44 rounded-xl border border-line bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 dark:border-[#333] dark:bg-[#171717]">
                <Link to="/profile" className="block rounded-lg px-3 py-2 text-sm hover:bg-bg dark:hover:bg-[#222]">
                  {t('nav.profile')}
                </Link>
                <Link to="/orders" className="block rounded-lg px-3 py-2 text-sm hover:bg-bg dark:hover:bg-[#222]">
                  {t('nav.orders')}
                </Link>
                {(user.role === 'seller' || user.role === 'admin') && (
                  <Link to="/seller" className="block rounded-lg px-3 py-2 text-sm hover:bg-bg dark:hover:bg-[#222]">
                    {t('nav.seller')}
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="block rounded-lg px-3 py-2 text-sm hover:bg-bg dark:hover:bg-[#222]">
                    {t('nav.admin')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-bg dark:hover:bg-[#222]"
                >
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-ink">
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 anim-fade-in lg:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-72 bg-white p-5 shadow-xl dark:bg-[#111]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <img src={logo} alt="S1NDZE" className="h-8" />
              <button onClick={() => setOpen(false)} className="rounded-lg p-2">
                <X />
              </button>
            </div>
            <form onSubmit={onSearch} className="mb-5">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('common.search')}
                className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm dark:border-[#333] dark:bg-[#1a1a1a]"
              />
            </form>
            <div className="flex flex-col gap-1">
              {nav.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium hover:bg-bg dark:hover:bg-[#222]">
                  {n.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              {langs.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLang(l.code)
                    i18n.changeLanguage(l.code)
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm',
                    lang === l.code && 'border-ink bg-bg',
                  )}
                >
                  <FlagIcon code={l.code} className="h-4 w-6" />
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
