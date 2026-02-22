import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Briefcase, Eye, EyeOff, UserCheck, Users } from 'lucide-react'
import { authApi } from '../../api/auth'
import { extractErrorMessage } from '../../api/axios'
import LoadingSpinner from '../../components/common/LoadingSpinner'

interface RegisterForm {
  full_name: string
  email: string
  role: 'seeker' | 'recruiter'
  password: string
  confirm_password: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { role: 'seeker' },
  })
  const selectedRole = watch('role')
  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      await authApi.register({
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        password: data.password,
      })
      toast.success('Account created! Please check your email to verify.')
      navigate('/login')
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

        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Join thousands of professionals on Jobly</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          {/* Role selector */}
          <div>
            <label className="label-field">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'seeker', label: 'Job Seeker', icon: Users, desc: 'Looking for work' },
                { value: 'recruiter', label: 'Recruiter', icon: Briefcase, desc: 'Hiring talent' },
              ].map(({ value, label, icon: Icon, desc }) => (
                <label
                  key={value}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedRole === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input type="radio" value={value} {...register('role')} className="sr-only" />
                  <Icon className={`h-6 w-6 ${selectedRole === value ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />
                  <div className="text-center">
                    <div className={`text-sm font-semibold font-display ${selectedRole === value ? '' : 'text-slate-700 dark:text-slate-300'}`}>{label}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">Full name</label>
            <input
              type="text"
              autoComplete="name"
              className={`input-field ${errors.full_name ? 'border-red-400' : ''}`}
              placeholder="John Doe"
              {...register('full_name', { required: 'Full name is required', minLength: { value: 2, message: 'Name too short' } })}
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="label-field">Email address</label>
            <input
              type="email"
              autoComplete="email"
              className={`input-field ${errors.email ? 'border-red-400' : ''}`}
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
              })}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label-field">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input-field pr-10 ${errors.password ? 'border-red-400' : ''}`}
                placeholder="At least 8 characters"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label-field">Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input-field ${errors.confirm_password ? 'border-red-400' : ''}`}
              placeholder="Re-enter your password"
              {...register('confirm_password', {
                required: 'Please confirm your password',
                validate: (v) => v === password || 'Passwords do not match',
              })}
            />
            {errors.confirm_password && <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>}
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-2.5">
            {isLoading ? <LoadingSpinner size="sm" /> : <UserCheck className="h-4 w-4" />}
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs text-slate-400 bg-white dark:bg-surface-800 px-3">
            Already have an account?
          </div>
        </div>

        <Link to="/login" className="mt-4 btn-outline w-full justify-center py-2.5 text-sm">
          Sign in instead
        </Link>
      </div>
    </div>
  )
}
