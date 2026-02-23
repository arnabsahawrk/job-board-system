import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { jobsApi } from '@/api/jobs'
import { extractErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

interface JobFormFields {
  title: string
  description: string
  requirements: string
  location: string
  job_type: string
  category: string
  company_name: string
  salary: string
  experience_required: string
  position_count: string
  application_deadline: string
}

const JOB_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'remote', label: 'Remote' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const CATEGORIES = [
  { value: 'it', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Design' },
  { value: 'other', label: 'Other' },
]

function JobForm({ defaultValues, onSubmit, isLoading, isEdit }: {
  defaultValues?: Partial<JobFormFields>
  onSubmit: (data: JobFormFields, logo?: File) => Promise<void>
  isLoading?: boolean
  isEdit?: boolean
}) {
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<JobFormFields>({
    defaultValues
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogo(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const submitHandler = async (data: JobFormFields) => {
    await onSubmit(data, logo || undefined)
  }

  const busy = isSubmitting || isLoading

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Job Title *</Label>
              <Input id="title" placeholder="e.g. Senior React Developer" {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" placeholder="e.g. Acme Corp" {...register('company_name', { required: 'Company name is required' })} />
              {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Job Type *</Label>
              <Controller name="job_type" control={control} rules={{ required: true }} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{JOB_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.job_type && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Controller name="category" control={control} rules={{ required: true }} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.category && <p className="text-xs text-destructive">Required</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location *</Label>
            <Input id="location" placeholder="e.g. New York, NY or Remote" {...register('location', { required: 'Location is required' })} />
            {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Job Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea id="description" placeholder="Describe the role, responsibilities, and team..." className="min-h-[140px]"
              {...register('description', { required: 'Description is required' })} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea id="requirements" placeholder="List skills, qualifications, and experience required..." className="min-h-[100px]"
              {...register('requirements')} />
          </div>
        </CardContent>
      </Card>

      {/* Compensation & Additional */}
      <Card>
        <CardHeader><CardTitle className="text-base">Compensation & Additional Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="salary">Monthly Salary (Taka)</Label>
              <Input id="salary" type="number" placeholder="e.g. 80000" {...register('salary')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experience_required">Min. Experience (years)</Label>
              <Input id="experience_required" type="number" min="0" placeholder="e.g. 2" {...register('experience_required')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position_count">Open Positions</Label>
              <Input id="position_count" type="number" min="1" placeholder="e.g. 3" {...register('position_count')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="application_deadline">Application Deadline</Label>
            <Input id="application_deadline" type="date" {...register('application_deadline')} />
          </div>
        </CardContent>
      </Card>

      {/* Company Logo */}
      <Card>
        <CardHeader><CardTitle className="text-base">Company Logo</CardTitle><CardDescription>Optional. PNG or JPG, max 1 MB.</CardDescription></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {logoPreview && (
              <div className="h-16 w-16 rounded-lg border overflow-hidden shrink-0">
                <img src={logoPreview} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors">
                <Upload className="h-4 w-4" /> {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Post Job'}
        </Button>
      </div>
    </form>
  )
}

export function PostJobPage() {
  const navigate = useNavigate()

  const handleSubmit = async (data: JobFormFields, logo?: File) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, val]) => { if (val) formData.append(key, val) })
    if (logo) formData.append('company_logo', logo)
    try {
      const res = await jobsApi.create(formData)
      toast.success('Job posted successfully!')
      navigate(`/jobs/${res.data.id}`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
      throw err
    }
  }

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-2xl font-bold font-display mb-6">Post a New Job</h1>
      <JobForm onSubmit={handleSubmit} />
    </div>
  )
}

export function EditJobPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [defaults, setDefaults] = useState<Partial<JobFormFields> | null>(null)

  useEffect(() => {
    if (!id) return
    jobsApi.get(parseInt(id)).then(res => {
      const job = res.data
      setDefaults({
        title: job.title,
        description: job.description,
        requirements: job.requirements || '',
        location: job.location,
        job_type: job.job_type,
        category: job.category,
        company_name: job.company_name,
        salary: job.salary?.toString() || '',
        experience_required: job.experience_required?.toString() || '',
        position_count: job.position_count?.toString() || '',
        application_deadline: job.application_deadline ? job.application_deadline.split('T')[0] : '',
      })
    }).catch(() => navigate('/my-jobs'))
  }, [id, navigate])

  const handleSubmit = async (data: JobFormFields, logo?: File) => {
    if (!id) return
    const formData = new FormData()
    Object.entries(data).forEach(([key, val]) => { if (val) formData.append(key, val) })
    if (logo) formData.append('company_logo', logo)
    try {
      await jobsApi.update(parseInt(id), formData)
      toast.success('Job updated successfully!')
      navigate(`/jobs/${id}`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
      throw err
    }
  }

  if (!defaults) return <div className="container py-8"><div className="h-96 bg-muted rounded-lg animate-pulse" /></div>

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-2xl font-bold font-display mb-6">Edit Job Listing</h1>
      <JobForm defaultValues={defaults} onSubmit={handleSubmit} isEdit />
    </div>
  )
}

interface JobFormFields {
  title: string; description: string; requirements: string; location: string; job_type: string;
  category: string; company_name: string; salary: string; experience_required: string; position_count: string; application_deadline: string;
}
