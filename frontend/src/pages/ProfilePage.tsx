import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Camera, Upload, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { authApi } from '@/api/auth'
import { extractErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

interface ProfileFormData {
  full_name: string
  phone_number: string
  bio: string
  skills: string
  experience: string
  experience_years: string
}

interface PasswordFormData {
  old_password: string
  new_password: string
  confirm: string
}

function FormField({
  id, label, error, children, hint,
}: {
  id: string; label: string; error?: string; children: React.ReactNode; hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [avatarFile, setAvatarFile]     = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [resumeFile, setResumeFile]     = useState<File | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const profileForm  = useForm<ProfileFormData>()
  const passwordForm = useForm<PasswordFormData>()

  useEffect(() => {
    if (!user) return
    profileForm.reset({
      full_name:       user.full_name || '',
      phone_number:    user.profile?.phone_number || '',
      bio:             user.profile?.bio || '',
      skills:          user.profile?.skills || '',
      experience:      user.profile?.experience || '',
      experience_years: String(user.profile?.experience_years ?? ''),
    })
    if (user.profile?.avatar) setAvatarPreview(user.profile.avatar)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const onSaveProfile = async (data: ProfileFormData) => {
    setSavingProfile(true)
    try {
      const formData = new FormData()
      formData.append('full_name', data.full_name)
      if (data.phone_number)    formData.append('phone_number', data.phone_number)
      if (data.bio)             formData.append('bio', data.bio)
      if (data.skills)          formData.append('skills', data.skills)
      if (data.experience)      formData.append('experience', data.experience)
      if (data.experience_years) formData.append('experience_years', data.experience_years)
      if (avatarFile)           formData.append('avatar', avatarFile)
      if (resumeFile)           formData.append('resume', resumeFile)

      await authApi.updateProfile(formData)
      await refreshUser()
      toast.success('Profile updated')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSavingProfile(false)
    }
  }

  const onChangePassword = async (data: PasswordFormData) => {
    if (data.new_password !== data.confirm) {
      passwordForm.setError('confirm', { message: 'Passwords do not match' })
      return
    }
    try {
      await authApi.changePassword({ old_password: data.old_password, new_password: data.new_password })
      toast.success('Password updated')
      passwordForm.reset()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const pfErrors = profileForm.formState.errors
  const pwErrors = passwordForm.formState.errors

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold font-display">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account details and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-7 w-full sm:w-auto">
          <TabsTrigger value="profile"  className="flex-1 sm:flex-none">Profile</TabsTrigger>
          <TabsTrigger value="security" className="flex-1 sm:flex-none">Security</TabsTrigger>
        </TabsList>

        {/* ── Profile tab ──────────────────────────────────────────────── */}
        <TabsContent value="profile">
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-5">

            {/* Avatar card */}
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <Avatar className="h-20 w-20 ring-2 ring-border ring-offset-2 ring-offset-background">
                      <AvatarImage src={avatarPreview ?? undefined} />
                      <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary shadow-md border-2 border-background hover:bg-primary/90 transition-colors"
                      aria-label="Change photo"
                    >
                      <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                      <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{user?.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    <span className="inline-block text-[11px] font-medium uppercase tracking-wide text-primary bg-primary/10 rounded px-1.5 py-0.5 mt-1.5 capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal info */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 grid gap-4">
                <FormField id="full_name" label="Full Name" error={pfErrors.full_name?.message}>
                  <Input
                    id="full_name"
                    {...profileForm.register('full_name', { required: 'Name is required' })}
                  />
                </FormField>
                <FormField id="phone_number" label="Phone Number" hint="Include country code, e.g. +880…">
                  <Input id="phone_number" type="tel" placeholder="+880 1700 000000" {...profileForm.register('phone_number')} />
                </FormField>
                <FormField id="bio" label="Bio" hint="Brief description shown to employers">
                  <Textarea
                    id="bio"
                    placeholder="Introduce yourself — your background, goals, and what you bring…"
                    className="min-h-[96px] resize-none"
                    {...profileForm.register('bio')}
                  />
                </FormField>
              </CardContent>
            </Card>

            {/* Professional details (seekers only) */}
            {user?.role === 'seeker' && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold">Professional Details</CardTitle>
                  <CardDescription className="text-xs">Used by employers to match you with relevant roles</CardDescription>
                </CardHeader>
                <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 grid gap-4">
                  <FormField id="skills" label="Skills" hint="Comma-separated, e.g. React, Python, Figma">
                    <Textarea
                      id="skills"
                      placeholder="React, TypeScript, Node.js, PostgreSQL…"
                      className="min-h-[80px] resize-none"
                      {...profileForm.register('skills')}
                    />
                  </FormField>

                  <FormField id="experience_years" label="Years of Experience">
                    <Input
                      id="experience_years"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="e.g. 3"
                      className="w-28"
                      {...profileForm.register('experience_years')}
                    />
                  </FormField>

                  <FormField id="experience" label="Experience Summary">
                    <Textarea
                      id="experience"
                      placeholder="Briefly describe your professional background…"
                      className="min-h-[80px] resize-none"
                      {...profileForm.register('experience')}
                    />
                  </FormField>

                  {/* Resume */}
                  <Separator />
                  <div className="space-y-2">
                    <Label>Resume / CV</Label>
                    {user.profile?.resume && (
                      <a
                        href={user.profile.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View current resume
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    )}
                    <label className="block cursor-pointer">
                      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-dashed border-input bg-background text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-accent/50 transition-all">
                        <Upload className="h-4 w-4" />
                        {resumeFile ? resumeFile.name : (user.profile?.resume ? 'Replace resume' : 'Upload resume')}
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="sr-only"
                        onChange={e => setResumeFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">PDF or Word, max 1 MB</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile} className="min-w-[120px]">
                {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Security tab ─────────────────────────────────────────────── */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
              <CardDescription className="text-xs">Choose a strong password of at least 8 characters.</CardDescription>
            </CardHeader>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)}>
              <CardContent className="px-5 sm:px-6 pb-2 pt-0 grid gap-4">
                <FormField id="old_password" label="Current Password" error={pwErrors.old_password?.message}>
                  <Input id="old_password" type="password" {...passwordForm.register('old_password', { required: 'Required' })} />
                </FormField>
                <Separator />
                <FormField id="new_password" label="New Password" error={pwErrors.new_password?.message}>
                  <Input
                    id="new_password"
                    type="password"
                    {...passwordForm.register('new_password', {
                      required: 'Required',
                      minLength: { value: 8, message: 'At least 8 characters' },
                    })}
                  />
                </FormField>
                <FormField id="confirm" label="Confirm New Password" error={pwErrors.confirm?.message}>
                  <Input
                    id="confirm"
                    type="password"
                    {...passwordForm.register('confirm', { required: 'Required' })}
                  />
                </FormField>
              </CardContent>
              <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2">
                <Button type="submit" disabled={passwordForm.formState.isSubmitting} className="min-w-[140px]">
                  {passwordForm.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </CardContent>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
