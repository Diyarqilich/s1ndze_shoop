import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { notificationsApi, profileApi, unwrapList } from '@/services/shop'
import type { Notification } from '@/types'

export function ProfilePage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const [tab, setTab] = useState<'profile' | 'notifications'>('profile')
  const qc = useQueryClient()
  const { register, handleSubmit } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone_number: user?.phone_number || '',
      bio: user?.bio || '',
      username: user?.username || '',
    },
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    enabled: !!user && tab === 'notifications',
  })
  const notifications = unwrapList(notifData || []) as Notification[]

  const save = useMutation({
    mutationFn: (payload: Record<string, string>) => profileApi.update(payload),
    onSuccess: async () => {
      await fetchMe()
      toast.success(t('profile.saved'))
    },
  })

  const markRead = useMutation({
    mutationFn: () => notificationsApi.markAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  if (!user) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <h1 className="font-display text-5xl tracking-wide">{t('profile.title')}</h1>
      <div className="mt-6 flex gap-4 text-sm uppercase tracking-widest">
        <button type="button" onClick={() => setTab('profile')} className={tab === 'profile' ? 'text-accent' : ''}>
          {t('nav.profile')}
        </button>
        <button type="button" onClick={() => setTab('notifications')} className={tab === 'notifications' ? 'text-accent' : ''}>
          {t('profile.notifications')}
        </button>
      </div>

      {tab === 'profile' && (
        <form
          onSubmit={handleSubmit((d) => save.mutate(d))}
          className="mt-8 space-y-4"
        >
          <p className="text-sm text-muted">
            {user.email} · <span className="uppercase text-accent">{user.role}</span>
          </p>
          <input {...register('username')} className="w-full border border-line bg-transparent px-3 py-3 dark:border-[#333]" />
          <div className="grid gap-4 sm:grid-cols-2">
            <input {...register('first_name')} placeholder={t('checkout.firstName')} className="border border-line bg-transparent px-3 py-3 dark:border-[#333]" />
            <input {...register('last_name')} placeholder={t('checkout.lastName')} className="border border-line bg-transparent px-3 py-3 dark:border-[#333]" />
          </div>
          <input {...register('phone_number')} placeholder={t('checkout.phone')} className="w-full border border-line bg-transparent px-3 py-3 dark:border-[#333]" />
          <textarea {...register('bio')} placeholder={t('profile.bioPlaceholder')} rows={4} className="w-full border border-line bg-transparent px-3 py-3 dark:border-[#333]" />
          <button type="submit" className="bg-ink px-6 py-3 text-sm uppercase tracking-widest text-paper dark:bg-paper dark:text-ink">
            {t('profile.save')}
          </button>
        </form>
      )}

      {tab === 'notifications' && (
        <div className="mt-8">
          <button type="button" onClick={() => markRead.mutate()} className="mb-4 text-sm underline">
            {t('profile.markAll')}
          </button>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className={`rounded-xl border border-line p-4 dark:border-[#333] ${n.is_read ? 'opacity-60' : ''}`}>
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-muted">{n.message}</p>
              </div>
            ))}
            {!notifications.length && <p className="text-muted">{t('profile.noNotifications')}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
