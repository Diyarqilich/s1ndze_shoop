import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const access = useAuthStore((s) => s.access)
  if (!access) return <Navigate to="/login" replace />
  return <Outlet />
}

export function SellerRoute() {
  const user = useAuthStore((s) => s.user)
  const access = useAuthStore((s) => s.access)
  if (!access) return <Navigate to="/login" replace />
  if (user && user.role !== 'seller' && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

export function AdminRoute() {
  const user = useAuthStore((s) => s.user)
  const access = useAuthStore((s) => s.access)
  if (!access) return <Navigate to="/login" replace />
  if (user && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
