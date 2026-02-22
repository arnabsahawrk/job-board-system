import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { CheckCircle, Mail, RefreshCw, XCircle } from 'lucide-react'
import { authApi } from '../../api/auth'
import { extractErrorMessage } from '../../api/axios'
import LoadingSpinner from '../../components/common/LoadingSpinner'

// ─── Verify Email ─────────────────────────────────────────────────────────────
export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found. Please check your email link.')
      return
    }
    authApi.verifyEmail(token)
      .then(() => { setStatus('success'); setMessage('Email verified successfully! You can now login.') })
      .catch((err) => { setStatus('error'); setMessage(extractErrorMessage(err)) })
  }, [token])

  return (
    <div className="w-full max-w-md">
      <div className="card shadow-xl p-8 text-center animate-scale-in">
        <Link to="/" className="flex items-center justify-center gap-2 font-bold font-display text-xl text-slate-900 dark:text-white mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm font-bold">J</div>
          Jobly
        </Link>

        {status === 'loading' && (
          <div className="py-8">
            <LoadingSpinner size="lg" label="Verifying your email..." />
          </div>
        )}
        {status === 'success' && (
          <div className="py-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">Email Verified!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{message}</p>
            <Link to="/login" className="btn-primary justify-center w-full">Go to Login</Link>
          </div>
        )}
        {status === 'error' && (
          <div className="py-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">Verification Failed</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{message}</p>
            <Link to="/resend-verification" className="btn-primary justify-center w-full">Resend Verification</Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Resend Verification ──────────────────────────────────────────────────────
export function ResendVerificationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>()

  const onSubmit = async ({ email }: { email: string }) => {
    setIsLoading(true)
    try {
      await authApi.resendVerification(email)
      setSent(true)
      toast.success('Verification email sent!')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card shadow-xl p-8 animate-scale-in">
        <Link to="/" className="flex items-center gap-2 font-bold font-display text-xl text-slate-900 dark:text-white mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm font-bold">J</div>
          Jobly
        </Link>

        {sent ? (
          <div className="text-center py-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">Check your inbox</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">We've sent a verification email. Click the link in the email to activate your account.</p>
            <Link to="/login" className="btn-outline justify-center w-full">Back to Login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Resend Verification</h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Enter your email to receive a new verification link</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
              <div>
                <label className="label-field">Email address</label>
                <input
                  type="email"
                  className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                  placeholder="you@example.com"
                  {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center">
                {isLoading ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
                {isLoading ? 'Sending...' : 'Send Verification Email'}
              </button>
              <Link to="/login" className="block text-center text-sm text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Back to Login
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>()

  const onSubmit = async ({ email }: { email: string }) => {
    setIsLoading(true)
    try {
      await authApi.requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card shadow-xl p-8 animate-scale-in">
        <Link to="/" className="flex items-center gap-2 font-bold font-display text-xl text-slate-900 dark:text-white mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm font-bold">J</div>
          Jobly
        </Link>

        {sent ? (
          <div className="text-center py-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary-500" />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">Check your email</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              If an account with that email exists, we've sent password reset instructions.
            </p>
            <Link to="/login" className="btn-outline justify-center w-full">Back to Login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Reset Password</h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">We'll send you a link to reset your password</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
              <div>
                <label className="label-field">Email address</label>
                <input
                  type="email"
                  className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                  placeholder="you@example.com"
                  {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center">
                {isLoading ? <LoadingSpinner size="sm" /> : <Mail className="h-4 w-4" />}
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <Link to="/login" className="block text-center text-sm text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Back to Login
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const uid = params.get('uid') || ''
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<{ new_password: string; confirm: string }>()
  const pwd = watch('new_password')

  const onSubmit = async ({ new_password }: { new_password: string; confirm: string }) => {
    if (!uid || !token) { toast.error('Invalid reset link. Please request a new one.'); return }
    setIsLoading(true)
    try {
      await authApi.confirmPasswordReset({ uid, token, new_password })
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  if (!uid || !token) {
    return (
      <div className="w-full max-w-md">
        <div className="card shadow-xl p-8 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">Invalid Link</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn-primary justify-center w-full">Request New Link</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="card shadow-xl p-8 animate-scale-in">
        <Link to="/" className="flex items-center gap-2 font-bold font-display text-xl text-slate-900 dark:text-white mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm font-bold">J</div>
          Jobly
        </Link>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Set New Password</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Choose a strong password for your account</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <div>
            <label className="label-field">New password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className={`input-field ${errors.new_password ? 'border-red-400' : ''}`}
              placeholder="At least 8 characters"
              {...register('new_password', { required: 'Password required', minLength: { value: 8, message: 'Min 8 characters' } })}
            />
            {errors.new_password && <p className="mt-1 text-xs text-red-500">{errors.new_password.message}</p>}
          </div>
          <div>
            <label className="label-field">Confirm new password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className={`input-field ${errors.confirm ? 'border-red-400' : ''}`}
              placeholder="Repeat password"
              {...register('confirm', { required: 'Please confirm', validate: (v) => v === pwd || 'Passwords do not match' })}
            />
            {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>}
          </div>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            {showPassword ? 'Hide' : 'Show'} passwords
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center">
            {isLoading ? <LoadingSpinner size="sm" /> : null}
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
