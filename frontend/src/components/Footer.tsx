import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import logo from '@/assets/s1ndze.jpg'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-8 border-t border-line bg-white dark:border-[#2a2a2a] dark:bg-[#111]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 lg:px-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <img src={logo} alt="S1NDZE" className="h-9 object-contain" />
            <span className="text-lg font-extrabold">S1NDZE SHOP</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted">{t('footer.tagline')}</p>
        </div>
        <div>
          <h4 className="font-semibold">{t('nav.shop')}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link to="/products" className="hover:text-ink dark:hover:text-white">{t('nav.shop')}</Link></li>
            <li><Link to="/products?new=true" className="hover:text-ink dark:hover:text-white">{t('nav.new')}</Link></li>
            <li><Link to="/products?sale=true" className="hover:text-ink dark:hover:text-white">{t('nav.sale')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">{t('footer.info')}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>{t('footer.about')}</li>
            <li>{t('footer.contact')}</li>
            <li>{t('footer.faq')}</li>
            <li>{t('footer.delivery')}</li>
            <li>{t('footer.returns')}</li>
          </ul>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">{t('footer.payments')}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase">
            {['Cash', 'Click', 'Payme', 'Uzcard', 'Humo'].map((p) => (
              <span key={p} className="rounded-md border border-line px-2 py-1 dark:border-[#333]">{p}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted dark:border-[#2a2a2a]">
        © {new Date().getFullYear()} S1NDZE SHOP
      </div>
    </footer>
  )
}
