import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout, { AuthLayout } from './components/layout/Layout'
import { ProtectedRoute, RoleRoute, GuestRoute } from './components/routes/ProtectedRoute'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import {
  VerifyEmailPage,
  ResendVerificationPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from './pages/auth/AuthPages'
import JobsPage from './pages/jobs/JobsPage'
import JobDetailPage from './pages/jobs/JobDetailPage'
import { PostJobPage, EditJobPage } from './pages/jobs/JobFormPages'
import MyJobsPage from './pages/jobs/MyJobsPage'
import MyApplicationsPage from './pages/applications/MyApplicationsPage'
import JobApplicationsPage from './pages/applications/JobApplicationsPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import ReviewsPage from './pages/reviews/ReviewsPage'

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            fontFamily: 'DM Sans, sans-serif',
          },
        }}
      />
      <Routes>
        {/* Public Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/reviews" element={<ReviewsPage />} />

            {/* Seeker only */}
            <Route element={<RoleRoute role="seeker" />}>
              <Route path="/applications" element={<MyApplicationsPage />} />
            </Route>

            {/* Recruiter only */}
            <Route element={<RoleRoute role="recruiter" />}>
              <Route path="/my-jobs" element={<MyJobsPage />} />
              <Route path="/jobs/post" element={<PostJobPage />} />
              <Route path="/jobs/:id/edit" element={<EditJobPage />} />
              <Route path="/jobs/:id/applications" element={<JobApplicationsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Auth Layout (Guest only) */}
        <Route element={<AuthLayout />}>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
          {/* Email verification - accessible regardless */}
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/resend-verification" element={<ResendVerificationPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
