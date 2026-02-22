import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  MapPin,
  Send,
  Star,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { jobsApi } from '../../api/jobs'
import { applicationsApi } from '../../api/applications'
import { reviewsApi } from '../../api/reviews'
import type { JobDetail, ReviewListItem } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { extractErrorMessage } from '../../api/axios'
import {
  JOB_CATEGORY_LABELS,
  JOB_TYPE_LABELS,
  formatDate,
  formatRelativeDate,
  formatSalary,
  getJobTypeBadgeClass,
} from '../../utils/helpers'
import { PageLoader } from '../../components/common/LoadingSpinner'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import JobCard from '../../components/common/JobCard'
import { JobCardSkeleton } from '../../components/common/SkeletonCard'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const jobId = Number(id)

  const [job, setJob] = useState<JobDetail | null>(null)
  const [reviews, setReviews] = useState<ReviewListItem[]>([])
  const [similarJobs, setSimilarJobs] = useState<typeof job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      try {
        const [jobRes, reviewsRes, similarRes] = await Promise.all([
          jobsApi.get(jobId),
          reviewsApi.jobReviews(jobId),
          jobsApi.similarJobs(jobId),
        ])
        setJob(jobRes.data)
        setReviews(reviewsRes.data)
        setSimilarJobs(similarRes.data as typeof job[])
      } catch {
        toast.error('Failed to load job details')
        navigate('/jobs')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [jobId, navigate])

  const handleApply = async () => {
    if (!resumeFile) { toast.error('Please attach your resume'); return }
    setApplying(true)
    try {
      const fd = new FormData()
      fd.append('job_id', String(jobId))
      fd.append('resume', resumeFile)
      if (coverLetter.trim()) fd.append('cover_letter', coverLetter)
      await applicationsApi.create(fd)
      toast.success('Application submitted! Check your email for confirmation.')
      setShowApplyForm(false)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setApplying(false)
    }
  }

  const handleDeleteJob = async () => {
    if (!confirm('Are you sure you want to delete this job? All applications will be lost.')) return
    setDeleting(true)
    try {
      await jobsApi.delete(jobId)
      toast.success('Job deleted successfully')
      navigate('/my-jobs')
    } catch (err) {
      toast.error(extractErrorMessage(err))
      setDeleting(false)
    }
  }

  if (isLoading) return <PageLoader />
  if (!job) return null

  const isOwner = user?.role === 'recruiter' && job.recruiter_email === user?.email
  const isSeeker = user?.role === 'seeker'
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="section-container py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-950/50 dark:to-indigo-950/50 flex items-center justify-center border border-slate-100 dark:border-slate-700 overflow-hidden flex-shrink-0">
                {job.company_logo ? (
                  <img src={job.company_logo} alt={job.company_name} className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-8 w-8 text-primary-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">{job.title}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{job.company_name}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={getJobTypeBadgeClass(job.job_type)}>{JOB_TYPE_LABELS[job.job_type]}</span>
                  <span className="badge-gray">{JOB_CATEGORY_LABELS[job.category]}</span>
                  {reviews.length > 0 && (
                    <span className="badge bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                      ★ {avgRating.toFixed(1)} ({reviews.length} reviews)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Meta info */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: MapPin, label: 'Location', value: job.location },
                { icon: DollarSign, label: 'Salary', value: formatSalary(job.salary) },
                { icon: Briefcase, label: 'Experience', value: `${job.experience_required}+ years` },
                { icon: Users, label: 'Positions', value: String(job.position_count) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{value}</div>
                </div>
              ))}
            </div>

            {job.application_deadline && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-amber-500" />
                <span className="text-slate-600 dark:text-slate-400">
                  Apply by <strong className="text-slate-900 dark:text-white">{formatDate(job.application_deadline)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-4">Job Description</h2>
            <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          <div className="card p-6">
            <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-4">Requirements</h2>
            <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
          </div>

          {/* Apply form */}
          {showApplyForm && isSeeker && (
            <div className="card p-6 border-primary-200 dark:border-primary-800/50 animate-slide-down">
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-5">Apply for this Position</h2>
              <div className="space-y-5">
                <div>
                  <label className="label-field">Resume *</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${resumeFile ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'}`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    />
                    <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    {resumeFile ? (
                      <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{resumeFile.name}</p>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Click to upload PDF, DOC, or DOCX<br />
                        <span className="text-xs">Max 1MB</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label-field">Cover Letter (optional)</label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={5}
                    className="input-field resize-none"
                    placeholder="Tell the recruiter why you're a great fit..."
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={handleApply} disabled={applying} className="btn-primary">
                    {applying ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button onClick={() => setShowApplyForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                  Reviews ({reviews.length})
                </h2>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                  ))}
                  <span className="ml-1 text-sm font-medium text-slate-600 dark:text-slate-400">{avgRating.toFixed(1)}</span>
                </div>
              </div>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="border-b border-slate-100 dark:border-slate-700/50 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{review.reviewer_name}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                        ))}
                        <span className="ml-1 text-xs text-slate-400">{formatRelativeDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Action card */}
          <div className="card p-5 sticky top-24">
            {isOwner ? (
              <div className="space-y-3">
                <h3 className="font-semibold font-display text-slate-900 dark:text-white text-sm mb-4">Manage this Job</h3>
                <Link to={`/edit-job/${job.id}`} className="btn-primary w-full justify-center">
                  <Edit className="h-4 w-4" />
                  Edit Job
                </Link>
                <Link to={`/job-applications?job_id=${job.id}`} className="btn-secondary w-full justify-center">
                  <Users className="h-4 w-4" />
                  View Applications
                </Link>
                <button onClick={handleDeleteJob} disabled={deleting} className="btn-danger w-full justify-center">
                  {deleting ? <LoadingSpinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                  {deleting ? 'Deleting...' : 'Delete Job'}
                </button>
              </div>
            ) : isAuthenticated && isSeeker ? (
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Posted <strong className="text-slate-700 dark:text-slate-300">{formatRelativeDate(job.created_at)}</strong> by{' '}
                  <strong className="text-slate-700 dark:text-slate-300">{job.recruiter_name}</strong>
                </p>
                {showApplyForm ? null : (
                  <button
                    onClick={() => setShowApplyForm(true)}
                    className="btn-primary w-full justify-center py-3"
                  >
                    <Send className="h-4 w-4" />
                    Apply Now
                  </button>
                )}
              </div>
            ) : !isAuthenticated ? (
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sign in to apply for this position</p>
                <Link to="/login" className="btn-primary w-full justify-center">
                  Sign In to Apply
                </Link>
              </div>
            ) : null}

            {/* Job meta */}
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Posted {formatRelativeDate(job.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">{job.recruiter_name}</span>
              </div>
            </div>
          </div>

          {/* Similar jobs */}
          {similarJobs.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold font-display text-slate-900 dark:text-white mb-4 text-sm">Similar Jobs</h3>
              <div className="space-y-3">
                {(similarJobs as any[]).map((sj) => (
                  <Link key={sj.id} to={`/jobs/${sj.id}`} className="block group">
                    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-950/50 dark:to-indigo-950/50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-primary-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">{sj.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{sj.company_name}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
