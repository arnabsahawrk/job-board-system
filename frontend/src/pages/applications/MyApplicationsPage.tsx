import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Building2, Eye, MessageSquare, Trash2 } from 'lucide-react'
import { applicationsApi } from '../../api/applications'
import type { ApplicationListItem } from '../../types'
import { extractErrorMessage } from '../../api/axios'
import { STATUS_COLORS, STATUS_LABELS, formatRelativeDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { ApplicationRowSkeleton } from '../../components/common/SkeletonCard'

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    applicationsApi.myApplications()
      .then((res) => setApplications(res.data))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Withdraw this application?')) return
    setDeletingId(id)
    try {
      await applicationsApi.delete(id)
      setApplications((prev) => prev.filter((a) => a.id !== id))
      toast.success('Application withdrawn')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = filter ? applications.filter((a) => a.status === filter) : applications

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    reviewed: applications.filter((a) => a.status === 'reviewed').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }

  return (
    <div className="section-container py-8">
      <div className="mb-8">
        <h1 className="page-title">My Applications</h1>
        <p className="page-subtitle">{applications.length} total application{applications.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: '', label: 'All', count: counts.all },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'reviewed', label: 'Reviewed', count: counts.reviewed },
          { key: 'accepted', label: 'Accepted', count: counts.accepted },
          { key: 'rejected', label: 'Rejected', count: counts.rejected },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <ApplicationRowSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={filter ? `No ${filter} applications` : 'No applications yet'}
          description={filter ? 'Try viewing a different status.' : 'Start applying to jobs and track your progress here.'}
          action={!filter ? <Link to="/jobs" className="btn-primary">Browse Jobs</Link> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div key={app.id} className="card-hover p-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-950/50 dark:to-indigo-950/50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <Link
                        to={`/jobs/${app.job}`}
                        className="font-semibold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-display"
                      >
                        {app.job_title}
                      </Link>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{app.job_company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={STATUS_COLORS[app.status]}>{STATUS_LABELS[app.status]}</span>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Applied {formatRelativeDate(app.applied_at)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/applications/${app.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/applications/${app.id}/feedback`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                        title="View feedback"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(app.id)}
                        disabled={deletingId === app.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Withdraw"
                      >
                        {deletingId === app.id ? <LoadingSpinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
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
