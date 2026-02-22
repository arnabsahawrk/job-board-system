import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/common/LoadingSpinner'
import type { UserRole } from '@/types'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <Outlet />
}

export function RoleRoute({ role }: { role: UserRole }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user || user.role !== role) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
