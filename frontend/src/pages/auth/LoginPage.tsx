import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { extractErrorMessage } from '../../api/axios'
import LoadingSpinner from '../../components/common/LoadingSpinner'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="card shadow-xl p-8 animate-scale-in">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold font-display text-xl text-slate-900 dark:text-white mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm font-bold">J</div>
          Jobly
        </Link>

        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Sign in to your account to continue</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <div>
            <label className="label-field">Email address</label>
            <input
              type="email"
              autoComplete="email"
              className={`input-field ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30' : ''}`}
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
              })}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label-field mb-0">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`input-field pr-10 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30' : ''}`}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-2.5 mt-2">
            {isLoading ? <LoadingSpinner size="sm" /> : <LogIn className="h-4 w-4" />}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-surface-800 px-3">
            Don't have an account?
          </div>
        </div>

        <Link to="/register" className="mt-4 btn-outline w-full justify-center py-2.5 text-sm">
          Create an account
        </Link>
      </div>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Having trouble?{' '}
        <Link to="/resend-verification" className="text-primary-600 dark:text-primary-400 hover:underline">
          Resend verification email
        </Link>
      </p>
    </div>
  )
}
