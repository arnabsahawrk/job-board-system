import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout, { AuthLayout } from '@/components/layout/Layout'
import { ProtectedRoute, RoleRoute, GuestRoute } from '@/components/routes/ProtectedRoute'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/context/AuthContext'

// Lazy-loaded pages
const HomePage              = lazy(() => import('@/pages/HomePage'))
const LoginPage             = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage          = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage    = lazy(() => import('@/pages/auth/AuthPages').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage     = lazy(() => import('@/pages/auth/AuthPages').then(m => ({ default: m.ResetPasswordPage })))
const VerifyEmailPage       = lazy(() => import('@/pages/auth/AuthPages').then(m => ({ default: m.VerifyEmailPage })))
const ResendVerificationPage= lazy(() => import('@/pages/auth/AuthPages').then(m => ({ default: m.ResendVerificationPage })))
const JobsPage              = lazy(() => import('@/pages/jobs/JobsPage'))
const JobDetailPage         = lazy(() => import('@/pages/jobs/JobDetailPage'))
const PostJobPage           = lazy(() => import('@/pages/jobs/JobFormPages').then(m => ({ default: m.PostJobPage })))
const EditJobPage           = lazy(() => import('@/pages/jobs/JobFormPages').then(m => ({ default: m.EditJobPage })))
const MyJobsPage            = lazy(() => import('@/pages/jobs/MyJobsPage'))
const MyApplicationsPage    = lazy(() => import('@/pages/applications/MyApplicationsPage'))
const JobApplicationsPage   = lazy(() => import('@/pages/applications/JobApplicationsPage'))
const DashboardPage         = lazy(() => import('@/pages/dashboard/DashboardPage'))
const ProfilePage           = lazy(() => import('@/pages/ProfilePage'))
const ReviewsPage           = lazy(() => import('@/pages/reviews/ReviewsPage'))

// Inner component that can use hooks (needs to be inside BrowserRouter)
function AppRoutes() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    const handler = () => {
      logout()
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth:session-expired', handler)
    return () => window.removeEventListener('auth:session-expired', handler)
  }, [navigate, logout])

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><PageLoader /></div>}>
      <Routes>
        {/* Public layout */}
        <Route element={<Layout />}>
          <Route path="/"              element={<HomePage />} />
          <Route path="/jobs"          element={<JobsPage />} />
          <Route path="/jobs/:id"      element={<JobDetailPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard"  element={<DashboardPage />} />
            <Route path="/profile"    element={<ProfilePage />} />
            <Route path="/reviews"    element={<ReviewsPage />} />

            <Route element={<RoleRoute role="seeker" />}>
              <Route path="/applications" element={<MyApplicationsPage />} />
            </Route>

            <Route element={<RoleRoute role="recruiter" />}>
              <Route path="/my-jobs"            element={<MyJobsPage />} />
              <Route path="/jobs/post"           element={<PostJobPage />} />
              <Route path="/jobs/:id/edit"       element={<EditJobPage />} />
              <Route path="/jobs/:id/applications" element={<JobApplicationsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Auth layout */}
        <Route element={<AuthLayout />}>
          <Route element={<GuestRoute />}>
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/register"        element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />
          </Route>
          <Route path="/verify-email"          element={<VerifyEmailPage />} />
          <Route path="/resend-verification"   element={<ResendVerificationPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton duration={4000} />
      <AppRoutes />
    </>
  )
}
