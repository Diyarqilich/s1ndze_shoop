import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { adminApi } from '@/services/shop'
import { getErrorMessage } from '@/services/api'
import { formatPrice } from '@/utils/format'
import { useAuthStore } from '@/store/authStore'
import type { Product, User } from '@/types'

export function AdminDashboard() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl tracking-wide">{t('admin.dashboard')}</h1>
        <div className="flex gap-3 text-sm uppercase tracking-widest">
          <Link to="/admin/users" className="hover:text-accent">
            {t('admin.users')}
          </Link>
          <Link to="/admin/products" className="hover:text-accent">
            {t('admin.products')}
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-10">{t('common.loading')}</div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [t('admin.totalUsers'), stats?.total_users],
            [t('admin.buyers'), stats?.total_buyers],
            [t('admin.sellers'), stats?.total_sellers],
            [t('admin.admins'), stats?.total_admins],
            [t('admin.totalProducts'), stats?.total_products],
            [t('admin.availableProducts'), stats?.available_products],
            [t('admin.totalOrders'), stats?.total_orders],
            [t('admin.pendingOrders'), stats?.pending_orders],
          ].map(([label, value]) => (
            <div key={String(label)} className="border border-line p-6 dark:border-[#333]">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
              <p className="mt-3 font-display text-4xl">{value ?? '—'}</p>
            </div>
          ))}
          <div className="border border-line p-6 sm:col-span-2 lg:col-span-4 dark:border-[#333]">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{t('admin.revenue')}</p>
            <p className="mt-3 font-display text-4xl">
              {stats?.total_revenue != null ? formatPrice(stats.total_revenue) : '—'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminUsersPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.users })
  const users = (data || []) as User[]

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.removeUser(id),
    onSuccess: () => {
      toast.success(t('admin.userDeleted'))
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err) => toast.error(getErrorMessage(err, t('common.error'))),
  })

  if (isLoading) return <div className="p-10">{t('common.loading')}</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <h1 className="mb-8 font-display text-4xl">{t('admin.users')}</h1>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wider text-muted">
              <th className="py-3">{t('admin.username')}</th>
              <th>{t('auth.email')}</th>
              <th>{t('admin.role')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line dark:border-[#333]">
                <td className="py-3">{u.username}</td>
                <td>{u.email}</td>
                <td className="capitalize">{u.role}</td>
                <td className="text-right">
                  {u.id === me?.id ? (
                    <span className="text-muted">{t('admin.you')}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(t('admin.confirmDeleteUser'))) remove.mutate(u.id)
                      }}
                      className="text-sale"
                    >
                      {t('seller.delete')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && <p className="mt-6 text-muted">{t('admin.noUsers')}</p>}
      </div>
    </div>
  )
}

export function AdminProductsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: adminApi.products })
  const products = (Array.isArray(data) ? data : (data as { results?: Product[] })?.results || []) as Product[]

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.removeProduct(id),
    onSuccess: () => {
      toast.success(t('seller.deleted'))
      qc.invalidateQueries({ queryKey: ['admin-products'] })
    },
    onError: (err) => toast.error(getErrorMessage(err, t('common.error'))),
  })

  if (isLoading) return <div className="p-10">{t('common.loading')}</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <h1 className="mb-8 font-display text-4xl">{t('admin.products')}</h1>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wider text-muted">
              <th className="py-3">{t('seller.name')}</th>
              <th>{t('admin.seller')}</th>
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
                <td>{p.seller_username || '—'}</td>
                <td>{formatPrice(p.price)}</td>
                <td>{p.is_available ? t('seller.active') : t('seller.off')}</td>
                <td className="text-right">
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
        {!products.length && <p className="mt-6 text-muted">{t('common.noResults')}</p>}
      </div>
    </div>
  )
}
