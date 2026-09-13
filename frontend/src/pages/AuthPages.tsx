import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AtSign,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Mail,
  ShoppingBag,
  Sparkles,
  Store,
  User as UserIcon,
} from 'lucide-react'
import logo from '@/assets/s1ndze.jpg'
import { useAuthStore } from '@/store/authStore'
import { getErrorMessage, getFieldErrors } from '@/services/api'
import { cn } from '@/utils/format'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [showPassword, setShowPassword] = useState(false)

  const loginSchema = z.object({
    username: z.string().min(1, t('auth.errRequired')),
    password: z.string().min(1, t('auth.errRequired')),
  })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) })

  return (
    <AuthShell
      title={t('auth.loginTitle')}
      subtitle={t('auth.hasAccount')}
      tagline="WELCOME BACK"
    >
      <form
        onSubmit={handleSubmit(async (d) => {
          try {
            await login(d.username.trim(), d.password)
            toast.success(t('auth.welcome'))
            navigate('/')
          } catch (err) {
            const fieldErrors = getFieldErrors(err)
            if (Object.keys(fieldErrors).length) {
              for (const [key, message] of Object.entries(fieldErrors)) {
                setError(key === 'detail' ? 'password' : (key as 'username' | 'password'), { message })
              }
            } else {
              setError('password', { message: '' })
            }
            toast.error(getErrorMessage(err, t('common.error')))
          }
        })}
        className="space-y-4"
        noValidate
      >
        <Field
          icon={<AtSign className="h-4 w-4" />}
          placeholder={t('auth.usernameOrEmail')}
          error={errors.username?.message}
          inputProps={register('username')}
        />
        <Field
          icon={<Lock className="h-4 w-4" />}
          placeholder={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          error={errors.password?.message}
          inputProps={register('password')}
          endAdornment={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              className="text-muted transition hover:text-ink dark:hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <SubmitButton loading={isSubmitting} loadingLabel={t('auth.signingIn')} label={t('nav.login')} />
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-semibold text-ink underline-offset-4 transition hover:underline dark:text-white">
          {t('nav.register')}
        </Link>
      </p>
    </AuthShell>
  )
}

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const registerUser = useAuthStore((s) => s.register)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const registerSchema = z
    .object({
      username: z
        .string()
        .trim()
        .min(3, t('auth.errUsernameMin'))
        .refine((v) => !/\s/.test(v), t('auth.errUsernameSpaces')),
      email: z.string().trim().email(t('auth.errEmailInvalid')),
      password: z.string().min(8, t('auth.errPasswordMin')),
      password_confirm: z.string().min(1, t('auth.errRequired')),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      role: z.enum(['buyer', 'seller']),
    })
    .refine((d) => d.password === d.password_confirm, {
      message: t('auth.errPasswordMismatch'),
      path: ['password_confirm'],
    })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'buyer' },
  })

  const role = watch('role')

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      subtitle={t('auth.noAccount')}
      tagline="JOIN THE CREW"
    >
      <form
        onSubmit={handleSubmit(async (d) => {
          try {
            await registerUser({
              ...d,
              username: d.username.trim(),
              email: d.email.trim(),
            } as unknown as Record<string, string>)
            toast.success(t('auth.welcome'))
            navigate('/')
          } catch (err) {
            const fieldErrors = getFieldErrors(err)
            if (Object.keys(fieldErrors).length) {
              for (const [key, message] of Object.entries(fieldErrors)) {
                if (key in d) setError(key as keyof typeof d, { message })
              }
            }
            toast.error(getErrorMessage(err, t('common.error')))
          }
        })}
        className="space-y-4"
        noValidate
      >
        <div>
          <Field
            icon={<AtSign className="h-4 w-4" />}
            placeholder={t('auth.username')}
            error={errors.username?.message}
            inputProps={register('username')}
          />
          {!errors.username && (
            <p className="mt-1.5 pl-1 text-xs text-muted">{t('auth.usernameHint')}</p>
          )}
        </div>
        <Field
          icon={<Mail className="h-4 w-4" />}
          placeholder={t('auth.email')}
          type="email"
          error={errors.email?.message}
          inputProps={register('email')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            icon={<UserIcon className="h-4 w-4" />}
            placeholder={t('auth.firstNameOptional')}
            inputProps={register('first_name')}
          />
          <Field
            icon={<UserIcon className="h-4 w-4" />}
            placeholder={t('auth.lastNameOptional')}
            inputProps={register('last_name')}
          />
        </div>
        <div>
          <Field
            icon={<Lock className="h-4 w-4" />}
            placeholder={t('auth.password')}
            type={showPassword ? 'text' : 'password'}
            error={errors.password?.message}
            inputProps={register('password')}
            endAdornment={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                className="text-muted transition hover:text-ink dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          {!errors.password && <p className="mt-1.5 pl-1 text-xs text-muted">{t('auth.passwordHint')}</p>}
        </div>
        <Field
          icon={<Lock className="h-4 w-4" />}
          placeholder={t('auth.confirm')}
          type={showConfirm ? 'text' : 'password'}
          error={errors.password_confirm?.message}
          inputProps={register('password_confirm')}
          endAdornment={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? t('auth.hidePassword') : t('auth.showPassword')}
              className="text-muted transition hover:text-ink dark:hover:text-white"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <div>
          <p className="mb-2 pl-1 text-xs font-semibold uppercase tracking-widest text-muted">{t('auth.role')}</p>
          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              active={role === 'buyer'}
              icon={<ShoppingBag className="h-5 w-5" />}
              title={t('auth.buyer')}
              desc={t('auth.roleBuyerDesc')}
              onClick={() => setValue('role', 'buyer', { shouldValidate: true })}
            />
            <RoleCard
              active={role === 'seller'}
              icon={<Store className="h-5 w-5" />}
              title={t('auth.seller')}
              desc={t('auth.roleSellerDesc')}
              onClick={() => setValue('role', 'seller', { shouldValidate: true })}
            />
          </div>
        </div>

        <SubmitButton loading={isSubmitting} loadingLabel={t('auth.creatingAccount')} label={t('nav.register')} />
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-semibold text-ink underline-offset-4 transition hover:underline dark:text-white">
          {t('nav.login')}
        </Link>
      </p>
    </AuthShell>
  )
}

function Field({
  icon,
  error,
  endAdornment,
  inputProps,
  placeholder,
  type = 'text',
}: {
  icon: React.ReactNode
  error?: string
  endAdornment?: React.ReactNode
  inputProps: ReturnType<ReturnType<typeof useForm>['register']>
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-2.5 rounded-xl border bg-white/60 px-3.5 py-3 transition focus-within:border-ink focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(17,17,17,0.06)] dark:bg-[#1a1a1a]/60 dark:focus-within:border-white dark:focus-within:bg-[#1a1a1a] dark:focus-within:shadow-[0_0_0_4px_rgba(255,255,255,0.06)]',
          error ? 'border-sale' : 'border-line dark:border-[#333]',
        )}
      >
        <span className={cn('shrink-0 transition', error ? 'text-sale' : 'text-muted group-focus-within:text-ink dark:group-focus-within:text-white')}>
          {icon}
        </span>
        <input
          {...inputProps}
          type={type}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {endAdornment}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 pl-1 text-xs font-medium text-sale anim-fade-in">{error}</p>
      )}
    </div>
  )
}

function RoleCard({
  active,
  icon,
  title,
  desc,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200',
        active
          ? 'border-ink bg-ink text-white shadow-lg dark:border-white dark:bg-white dark:text-ink'
          : 'border-line hover:border-ink/40 hover:bg-bg dark:border-[#333] dark:hover:bg-[#1a1a1a]',
      )}
    >
      <span
        className={cn(
          'mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg transition',
          active ? 'bg-white/15 dark:bg-ink/10' : 'bg-bg dark:bg-[#222]',
        )}
      >
        {icon}
      </span>
      <p className="text-sm font-semibold">{title}</p>
      <p className={cn('mt-0.5 text-xs', active ? 'opacity-80' : 'text-muted')}>{desc}</p>
    </button>
  )
}

function SubmitButton({
  loading,
  loadingLabel,
  label,
}: {
  loading: boolean
  loadingLabel: string
  label: string
}) {
  return (
    <button
      disabled={loading}
      className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-ink py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-200 hover:bg-accent-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-ink"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <span className="transition-transform group-hover:scale-[1.02]">{label}</span>
      )}
    </button>
  )
}

function AuthShell({
  title,
  subtitle,
  tagline,
  children,
}: {
  title: string
  subtitle: string
  tagline: string
  children: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-ink/[0.04] blur-3xl dark:bg-white/[0.04]" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-sale/[0.05] blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-0 px-4 py-10 lg:grid-cols-2 lg:gap-12 lg:px-6">
        <div className="relative hidden anim-fade-up lg:block">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-white to-bg p-10 dark:border-[#2a2a2a] dark:from-[#161616] dark:to-[#0d0d0d]">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-ink/5 dark:bg-white/5" />
            <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-sale/10" />
            <img src={logo} alt="S1NDZE" className="relative mx-auto max-h-72 object-contain drop-shadow-xl" />
            <div className="relative mt-8 text-center">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:border-[#333] dark:bg-[#171717]">
                <Sparkles className="h-3 w-3" /> {tagline}
              </p>
              <p className="mt-4 font-display text-4xl leading-tight tracking-wide">
                WEAR YOUR <span className="text-sale">STYLE</span>
              </p>
              <p className="mx-auto mt-3 max-w-xs text-sm text-muted">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="anim-fade-up rounded-3xl border border-line bg-white/80 p-6 shadow-xl shadow-black/[0.03] backdrop-blur-sm sm:p-9 dark:border-[#2a2a2a] dark:bg-[#141414]/80 dark:shadow-black/20">
          <h1 className="font-display text-3xl tracking-wide sm:text-4xl">{title}</h1>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
