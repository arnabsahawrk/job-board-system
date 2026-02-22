import { Bookmark, Building2, Clock, DollarSign, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { JobListItem } from '../../types'
import {
  JOB_CATEGORY_LABELS,
  JOB_TYPE_LABELS,
  formatRelativeDate,
  formatSalary,
  getJobTypeBadgeClass,
} from '../../utils/helpers'

interface JobCardProps {
  job: JobListItem
  variant?: 'default' | 'compact'
}

export default function JobCard({ job, variant = 'default' }: JobCardProps) {
  const categoryLabel = JOB_CATEGORY_LABELS[job.category] || job.category

  return (
    <Link to={`/jobs/${job.id}`}>
      <div className="card-hover p-5 cursor-pointer group">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-950/50 dark:to-indigo-950/50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-100 dark:border-slate-700">
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company_name}
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <Building2 className="h-5 w-5 text-primary-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate font-display">
              {job.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{job.company_name}</p>
          </div>
          {variant === 'default' && (
            <Bookmark className="h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5" />
          )}
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={getJobTypeBadgeClass(job.job_type)}>
            {JOB_TYPE_LABELS[job.job_type]}
          </span>
          <span className="badge-gray">{categoryLabel}</span>
        </div>

        {/* Info */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location}
          </span>
          {job.salary && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {formatSalary(job.salary)}/yr
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeDate(job.created_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}
