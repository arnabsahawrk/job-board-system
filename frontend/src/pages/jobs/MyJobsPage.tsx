import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Edit, Eye, Plus, Trash2, Users } from 'lucide-react'
import { jobsApi } from '../../api/jobs'
import type { JobListItem } from '../../types'
import { extractErrorMessage } from '../../api/axios'
import { JOB_TYPE_LABELS, formatDate, formatRelativeDate, formatSalary, getJobTypeBadgeClass } from '../../utils/helpers'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { JobCardSkeleton } from '../../components/common/SkeletonCard'

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchJobs = async () => {
    try {
      const res = await jobsApi.myJobs()
      setJobs(res.data)
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this job? All applications will be removed.')) return
    setDeletingId(id)
    try {
      await jobsApi.delete(id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
      toast.success('Job deleted')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="section-container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">My Job Listings</h1>
          <p className="page-subtitle">{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
        </div>
        <Link to="/post-job" className="btn-primary">
          <Plus className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs posted yet"
          description="Share your first opportunity and find the perfect candidate."
          action={<Link to="/post-job" className="btn-primary"><Plus className="h-4 w-4" />Post a Job</Link>}
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="card-hover p-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-950/50 dark:to-indigo-950/50 flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-slate-700 overflow-hidden">
                  {job.company_logo ? (
                    <img src={job.company_logo} alt={job.company_name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-lg">🏢</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link to={`/jobs/${job.id}`} className="font-semibold font-display text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {job.title}
                      </Link>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{job.company_name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link to={`/jobs/${job.id}`} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="View">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link to={`/edit-job/${job.id}`} className="p-2 rounded-lg text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors" title="Edit">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <Link to={`/job-applications?job_id=${job.id}`} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors" title="Applications">
                        <Users className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(job.id)}
                        disabled={deletingId === job.id}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete"
                      >
                        {deletingId === job.id ? <LoadingSpinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className={getJobTypeBadgeClass(job.job_type)}>{JOB_TYPE_LABELS[job.job_type]}</span>
                    <span>📍 {job.location}</span>
                    {job.salary && <span>💰 {formatSalary(job.salary)}/yr</span>}
                    <span className="ml-auto">Posted {formatRelativeDate(job.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
