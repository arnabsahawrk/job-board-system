import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, CheckCircle, Clock, Plus, Search, Star, TrendingUp, Users, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { applicationsApi } from '../../api/applications'
import { jobsApi } from '../../api/jobs'
import { reviewsApi } from '../../api/reviews'
import type { StatusSummary, JobListItem, ReviewListItem } from '../../types'
import { formatRelativeDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { StatCardSkeleton } from '../../components/common/SkeletonCard'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-2xl font-bold font-display text-slate-900 dark:text-white">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    </div>
  )
}

function SeekerDashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<StatusSummary | null>(null)
  const [recentJobs, setRecentJobs] = useState<JobListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      applicationsApi.statusSummary(),
      jobsApi.list({ page_size: 5 }),
    ])
      .then(([sumRes, jobsRes]) => {
        setSummary(sumRes.data)
        setRecentJobs(jobsRes.data.results)
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="section-container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Welcome back, {user?.full_name.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">Here's an overview of your job search activity</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Applied" value={summary.total} icon={Briefcase} color="bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400" />
          <StatCard label="Pending Review" value={summary.pending} icon={Clock} color="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" />
          <StatCard label="Accepted" value={summary.accepted} icon={CheckCircle} color="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Reviewed" value={summary.reviewed} icon={TrendingUp} color="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/jobs" className="card-hover p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center flex-shrink-0">
            <Search className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-semibold font-display text-slate-900 dark:text-white">Browse Jobs</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Find your next opportunity</div>
          </div>
        </Link>
        <Link to="/my-applications" className="card-hover p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-semibold font-display text-slate-900 dark:text-white">My Applications</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Track your applications</div>
          </div>
        </Link>
      </div>

      {/* Recent jobs */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold font-display text-slate-900 dark:text-white">Latest Jobs</h2>
          <Link to="/jobs" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
        </div>
        {isLoading ? (
          <LoadingSpinner className="py-8" />
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-950/50 dark:to-indigo-950/50 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-4.5 w-4.5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">{job.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{job.company_name} · {job.location}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{formatRelativeDate(job.created_at)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RecruiterDashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<StatusSummary | null>(null)
  const [myJobs, setMyJobs] = useState<JobListItem[]>([])
  const [reviews, setReviews] = useState<ReviewListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      applicationsApi.statusSummary(),
      jobsApi.myJobs(),
      reviewsApi.myReceivedReviews(),
    ])
      .then(([sumRes, jobsRes, reviewsRes]) => {
        setSummary(sumRes.data)
        setMyJobs(jobsRes.data.slice(0, 5))
        setReviews(reviewsRes.data.slice(0, 3))
      })
      .finally(() => setIsLoading(false))
  }, [])

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  return (
    <div className="section-container py-8">
      <div className="mb-8">
        <h1 className="page-title">Welcome, {user?.full_name.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">Here's your recruiting activity overview</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Applicants" value={summary?.total || 0} icon={Users} color="bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400" />
          <StatCard label="Pending Review" value={summary?.pending || 0} icon={Clock} color="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" />
          <StatCard label="Accepted" value={summary?.accepted || 0} icon={CheckCircle} color="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Avg. Rating" value={avgRating} icon={Star} color="bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400" />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/post-job" className="card-hover p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center flex-shrink-0">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-semibold font-display text-slate-900 dark:text-white">Post a Job</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Find your next hire</div>
          </div>
        </Link>
        <Link to="/job-applications" className="card-hover p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-semibold font-display text-slate-900 dark:text-white">Review Applications</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Manage candidates</div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My jobs */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold font-display text-slate-900 dark:text-white">My Jobs</h2>
            <Link to="/my-jobs" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <LoadingSpinner className="py-8" />
          ) : myJobs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">No jobs posted yet</p>
              <Link to="/post-job" className="btn-primary mt-3 text-sm"><Plus className="h-3.5 w-3.5" />Post a Job</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myJobs.map((job) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-950/50 dark:to-indigo-950/50 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-4 w-4 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{job.title}</p>
                    <p className="text-xs text-slate-400">{formatRelativeDate(job.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent reviews */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold font-display text-slate-900 dark:text-white">Recent Reviews</h2>
          </div>
          {isLoading ? (
            <LoadingSpinner className="py-8" />
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-slate-100 dark:border-slate-700/50 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.reviewer_name}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{r.job_title} · {formatRelativeDate(r.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  if (user?.role === 'recruiter') return <RecruiterDashboard />
  return <SeekerDashboard />
}
