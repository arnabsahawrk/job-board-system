import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle, ChevronDown, Eye, FileText, Mail, Phone, User, XCircle } from 'lucide-react'
import { applicationsApi } from '../../api/applications'
import type { ApplicationListItem } from '../../types'
import { extractErrorMessage } from '../../api/axios'
import { STATUS_COLORS, STATUS_LABELS, formatRelativeDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { ApplicationRowSkeleton } from '../../components/common/SkeletonCard'

interface UpdateModalProps {
  applicationId: number
  currentStatus: string
  applicantName: string
  onClose: () => void
  onUpdated: () => void
}

function UpdateStatusModal({ applicationId, currentStatus, applicantName, onClose, onUpdated }: UpdateModalProps) {
  const [status, setStatus] = useState(currentStatus)
  const [feedbackText, setFeedbackText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!feedbackText.trim()) { toast.error('Feedback is required'); return }
    setIsLoading(true)
    try {
      await applicationsApi.updateStatus(applicationId, status, feedbackText)
      toast.success('Status updated successfully!')
      onUpdated()
      onClose()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
        <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-1">Update Application Status</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">for <strong className="text-slate-700 dark:text-slate-300">{applicantName}</strong></p>

        <div className="space-y-4">
          <div>
            <label className="label-field">New Status</label>
            <div className="grid grid-cols-2 gap-2">
              {(['pending', 'reviewed', 'accepted', 'rejected'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    status === s
                      ? s === 'accepted' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                      : s === 'rejected' ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                      : 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">Feedback Message *</label>
            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="input-field resize-none"
              placeholder="Provide feedback to the applicant..."
              maxLength={1000}
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{feedbackText.length}/1000</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex-1 justify-center">
              {isLoading ? <LoadingSpinner size="sm" /> : null}
              {isLoading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JobApplicationsPage() {
  const [searchParams] = useSearchParams()
  const jobId = searchParams.get('job_id') ? Number(searchParams.get('job_id')) : undefined
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [updateModal, setUpdateModal] = useState<{ id: number; status: string; name: string } | null>(null)

  const fetchApplications = async () => {
    try {
      const res = await applicationsApi.jobApplications(jobId)
      setApplications(res.data)
    } catch {
      toast.error('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchApplications() }, [jobId])

  const filtered = filter ? applications.filter((a) => a.status === filter) : applications

  return (
    <div className="section-container py-8">
      <div className="mb-8">
        <h1 className="page-title">
          {jobId ? 'Job Applications' : 'All Applications'}
        </h1>
        <p className="page-subtitle">{applications.length} total application{applications.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'pending', 'reviewed', 'accepted', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === s
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {s || 'All'}
            <span className="ml-1.5 text-xs opacity-70">
              ({s ? applications.filter((a) => a.status === s).length : applications.length})
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <ApplicationRowSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No applications found" description="Applications will appear here when candidates apply to your jobs." />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div key={app.id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold font-display flex-shrink-0">
                  {app.applicant_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white font-display">{app.applicant_name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{app.applicant_email}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        For: <span className="text-slate-600 dark:text-slate-300">{app.job_title}</span> · Applied {formatRelativeDate(app.applied_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={STATUS_COLORS[app.status]}>{STATUS_LABELS[app.status]}</span>
                      <button
                        onClick={() => setUpdateModal({ id: app.id, status: app.status, name: app.applicant_name })}
                        className="btn-outline py-1.5 px-3 text-xs"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {updateModal && (
        <UpdateStatusModal
          applicationId={updateModal.id}
          currentStatus={updateModal.status}
          applicantName={updateModal.name}
          onClose={() => setUpdateModal(null)}
          onUpdated={fetchApplications}
        />
      )}
    </div>
  )
}
