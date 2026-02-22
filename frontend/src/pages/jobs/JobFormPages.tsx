import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Building2, Image, Loader2, Plus } from 'lucide-react'
import { jobsApi } from '../../api/jobs'
import { extractErrorMessage } from '../../api/axios'
import { JOB_CATEGORY_LABELS, JOB_TYPE_LABELS } from '../../utils/helpers'
import LoadingSpinner, { PageLoader } from '../../components/common/LoadingSpinner'

interface JobFormData {
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

function JobForm({ defaultValues, onSubmit, isLoading, title }: {
  defaultValues?: Partial<JobFormData>
  onSubmit: (data: JobFormData, logo?: File) => Promise<void>
  isLoading: boolean
  title: string
}) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<JobFormData>({
    defaultValues,
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const submitHandler = (data: JobFormData) => onSubmit(data, logoFile || undefined)

  return (
    <div className="section-container py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">Fill in the details to post your opportunity</p>
        </div>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
          {/* Basic Info */}
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold font-display text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="label-field">Job Title *</label>
                <input
                  className={`input-field ${errors.title ? 'border-red-400' : ''}`}
                  placeholder="e.g. Senior Django Developer"
                  {...register('title', { required: 'Job title is required' })}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div>
                <label className="label-field">Category *</label>
                <select className={`input-field ${errors.category ? 'border-red-400' : ''}`}
                  {...register('category', { required: 'Category is required' })}>
                  <option value="">Select category</option>
                  {Object.entries(JOB_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
              </div>

              <div>
                <label className="label-field">Job Type *</label>
                <select className={`input-field ${errors.job_type ? 'border-red-400' : ''}`}
                  {...register('job_type', { required: 'Job type is required' })}>
                  <option value="">Select type</option>
                  {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                {errors.job_type && <p className="mt-1 text-xs text-red-500">{errors.job_type.message}</p>}
              </div>

              <div>
                <label className="label-field">Location *</label>
                <input
                  className={`input-field ${errors.location ? 'border-red-400' : ''}`}
                  placeholder="e.g. New York, NY or Remote"
                  {...register('location', { required: 'Location is required' })}
                />
                {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>}
              </div>

              <div>
                <label className="label-field">Salary (USD/year)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 120000"
                  {...register('salary', { min: { value: 1, message: 'Salary must be positive' } })}
                />
              </div>

              <div>
                <label className="label-field">Experience Required (years)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  min="0"
                  {...register('experience_required', { min: 0 })}
                />
              </div>

              <div>
                <label className="label-field">Number of Positions</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="1"
                  min="1"
                  {...register('position_count', { min: { value: 1, message: 'Min 1 position' } })}
                />
              </div>

              <div>
                <label className="label-field">Application Deadline</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  {...register('application_deadline')}
                />
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold font-display text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
              Company Details
            </h2>

            <div>
              <label className="label-field">Company Name *</label>
              <input
                className={`input-field ${errors.company_name ? 'border-red-400' : ''}`}
                placeholder="e.g. Tech Corp"
                {...register('company_name', { required: 'Company name is required' })}
              />
              {errors.company_name && <p className="mt-1 text-xs text-red-500">{errors.company_name.message}</p>}
            </div>

            <div>
              <label className="label-field">Company Logo</label>
              <div
                onClick={() => logoRef.current?.click()}
                className="flex items-center gap-4 p-4 border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
              >
                <input ref={logoRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleLogoChange} />
                <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                  ) : (
                    <Building2 className="h-7 w-7 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {logoFile ? logoFile.name : 'Upload company logo'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">JPG, PNG — max 1MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Requirements */}
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold font-display text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
              Job Details
            </h2>

            <div>
              <label className="label-field">Job Description *</label>
              <textarea
                rows={7}
                className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
                placeholder="Describe the role, responsibilities, and what a day looks like..."
                {...register('description', { required: 'Description is required' })}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div>
              <label className="label-field">Requirements *</label>
              <textarea
                rows={5}
                className={`input-field resize-none ${errors.requirements ? 'border-red-400' : ''}`}
                placeholder="List required skills, experience, and qualifications..."
                {...register('requirements', { required: 'Requirements are required' })}
              />
              {errors.requirements && <p className="mt-1 text-xs text-red-500">{errors.requirements.message}</p>}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 justify-end">
            <button type="button" onClick={() => window.history.back()} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary px-8">
              {isLoading ? <LoadingSpinner size="sm" /> : <Plus className="h-4 w-4" />}
              {isLoading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function PostJobPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (data: JobFormData, logo?: File) => {
    setIsLoading(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (logo) fd.append('company_logo', logo)
      const res = await jobsApi.create(fd)
      toast.success('Job posted successfully!')
      navigate(`/jobs/${res.data.id}`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return <JobForm title="Post a New Job" onSubmit={onSubmit} isLoading={isLoading} />
}

export function EditJobPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState<Partial<JobFormData>>({})

  useEffect(() => {
    jobsApi.get(Number(id))
      .then(({ data }) => {
        setDefaultValues({
          title: data.title,
          description: data.description,
          requirements: data.requirements,
          location: data.location,
          job_type: data.job_type,
          category: data.category,
          company_name: data.company_name,
          salary: data.salary ? String(data.salary) : '',
          experience_required: String(data.experience_required),
          position_count: String(data.position_count),
          application_deadline: data.application_deadline?.slice(0, 16) || '',
        })
      })
      .catch(() => { toast.error('Failed to load job'); navigate('/my-jobs') })
      .finally(() => setPageLoading(false))
  }, [id, navigate])

  const onSubmit = async (data: JobFormData, logo?: File) => {
    setIsLoading(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (logo) fd.append('company_logo', logo)
      await jobsApi.update(Number(id), fd)
      toast.success('Job updated successfully!')
      navigate(`/jobs/${id}`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  if (pageLoading) return <PageLoader />
  return <JobForm title="Edit Job" defaultValues={defaultValues} onSubmit={onSubmit} isLoading={isLoading} />
}


