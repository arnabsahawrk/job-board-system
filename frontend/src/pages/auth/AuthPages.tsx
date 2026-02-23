import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/api/auth'
import { extractErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Forgot Password ─────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<{ email: string }>()

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await authApi.requestPasswordReset(email)
    } catch {
      // Always show success to prevent email enumeration
    }
  }

  if (isSubmitSuccessful) {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardContent className="pt-8 pb-6 space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="font-display font-bold text-lg">Check your email</h2>
          <p className="text-sm text-muted-foreground">If an account exists, we've sent reset instructions to your email.</p>
          <Button variant="outline" size="sm" asChild><Link to="/login">Back to sign in</Link></Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader><CardTitle className="font-display">Reset password</CardTitle><CardDescription>Enter your email and we'll send reset instructions.</CardDescription></CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email', { required: 'Email required' })} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Send Instructions
          </Button>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Back to sign in</Link>
        </CardFooter>
      </form>
    </Card>
  )
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<{ new_password: string; confirm: string }>()

  const onSubmit = async ({ new_password }: { new_password: string; confirm: string }) => {
    try {
      await authApi.confirmPasswordReset({ uid, token, new_password })
      toast.success('Password reset! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  if (!uid || !token) return (
    <Card className="w-full max-w-sm text-center">
      <CardContent className="pt-8 space-y-3">
        <XCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground">Invalid or expired reset link.</p>
        <Button asChild><Link to="/forgot-password">Request New Link</Link></Button>
      </CardContent>
    </Card>
  )

  return (
    <Card className="w-full max-w-sm">
      <CardHeader><CardTitle className="font-display">Set new password</CardTitle></CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" {...register('new_password', { required: true, minLength: { value: 8, message: 'At least 8 characters' } })} />
            {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input type="password" {...register('confirm', { validate: v => v === watch('new_password') || 'Passwords do not match' })} />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Reset Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// ─── Verify Email ─────────────────────────────────────────────────────────────
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const hasRequestedRef = useRef(false)

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    if (hasRequestedRef.current) return
    hasRequestedRef.current = true
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <Card className="w-full max-w-sm text-center">
      <CardContent className="pt-8 pb-6 space-y-3">
        {status === 'loading' && <><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" /><p className="text-sm">Verifying your email...</p></>}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
            <h2 className="font-semibold">Email verified!</h2>
            <p className="text-sm text-muted-foreground">Your account is now active. You can sign in.</p>
            <Button asChild><Link to="/login">Sign In</Link></Button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="font-semibold">Verification failed</h2>
            <p className="text-sm text-muted-foreground">The link may be invalid or expired.</p>
            <Button variant="outline" asChild><Link to="/resend-verification">Resend Verification</Link></Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Resend Verification ──────────────────────────────────────────────────────
export function ResendVerificationPage() {
  const { register, handleSubmit, formState: { isSubmitting, isSubmitSuccessful } } = useForm<{ email: string }>()

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await authApi.resendVerification(email)
    } catch { /* silently succeed */ }
  }

  if (isSubmitSuccessful) return (
    <Card className="w-full max-w-sm text-center">
      <CardContent className="pt-8 space-y-3">
        <Mail className="h-10 w-10 text-primary mx-auto" />
        <p className="text-sm">If the email is registered, a verification link has been sent.</p>
        <Button asChild><Link to="/login">Go to Sign In</Link></Button>
      </CardContent>
    </Card>
  )

  return (
    <Card className="w-full max-w-sm">
      <CardHeader><CardTitle className="font-display">Resend verification</CardTitle></CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register('email', { required: true })} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Send Verification
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
