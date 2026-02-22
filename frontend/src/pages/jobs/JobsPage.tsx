import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { jobsApi, type JobFilters } from '../../api/jobs'
import type { JobListItem, PaginatedResponse } from '../../types'
import { JOB_CATEGORY_LABELS, JOB_TYPE_LABELS } from '../../utils/helpers'
import JobCard from '../../components/common/JobCard'
import { JobCardSkeleton } from '../../components/common/SkeletonCard'
import { EmptyState } from '../../components/common/EmptyState'

const CATEGORIES = Object.entries(JOB_CATEGORY_LABELS)
const JOB_TYPES = Object.entries(JOB_TYPE_LABELS)
const ORDERING_OPTIONS = [
  { value: '-created_at', label: 'Newest first' },
  { value: 'created_at', label: 'Oldest first' },
  { value: '-salary', label: 'Highest salary' },
  { value: 'salary', label: 'Lowest salary' },
]

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<PaginatedResponse<JobListItem> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const filters: JobFilters = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    job_type: searchParams.get('job_type') || undefined,
    location: searchParams.get('location') || undefined,
    ordering: searchParams.get('ordering') || '-created_at',
    page: Number(searchParams.get('page')) || 1,
  }

  const fetchJobs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await jobsApi.list(filters)
      setData(res.data)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const updateFilter = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters = searchParams.get('category') || searchParams.get('job_type') || searchParams.get('location') || searchParams.get('search')

  const totalPages = data ? Math.ceil(data.count / 10) : 0
  const currentPage = Number(searchParams.get('page')) || 1

  return (
    <div className="section-container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Find Your Next Role</h1>
        <p className="page-subtitle">{data ? `${data.count.toLocaleString()} jobs available` : 'Searching jobs...'}</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            defaultValue={filters.search || ''}
            placeholder="Search jobs, companies, skills..."
            className="input-field pl-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilter('search', (e.target as HTMLInputElement).value)
              }
            }}
            onChange={(e) => {
              if (!e.target.value) updateFilter('search', null)
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-outline gap-2 ${showFilters ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-primary-500" />
          )}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn-outline text-red-500 hover:border-red-400 gap-2">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-5 mb-6 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Category */}
            <div>
              <label className="label-field">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) => updateFilter('category', e.target.value || null)}
                className="input-field"
              >
                <option value="">All categories</option>
                {CATEGORIES.map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Job type */}
            <div>
              <label className="label-field">Job Type</label>
              <select
                value={filters.job_type || ''}
                onChange={(e) => updateFilter('job_type', e.target.value || null)}
                className="input-field"
              >
                <option value="">All types</option>
                {JOB_TYPES.map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="label-field">Location</label>
              <input
                type="text"
                defaultValue={filters.location || ''}
                placeholder="City, state, remote..."
                className="input-field"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateFilter('location', (e.target as HTMLInputElement).value || null)
                }}
              />
            </div>

            {/* Sort */}
            <div>
              <label className="label-field">Sort By</label>
              <select
                value={filters.ordering || '-created_at'}
                onChange={(e) => updateFilter('ordering', e.target.value)}
                className="input-field"
              >
                {ORDERING_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-5">
          {filters.search && (
            <button
              onClick={() => updateFilter('search', null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/50 hover:bg-primary-100 transition-colors"
            >
              Search: {filters.search}
              <X className="h-3 w-3" />
            </button>
          )}
          {filters.category && (
            <button
              onClick={() => updateFilter('category', null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium badge-gray border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {JOB_CATEGORY_LABELS[filters.category as keyof typeof JOB_CATEGORY_LABELS]}
              <X className="h-3 w-3" />
            </button>
          )}
          {filters.job_type && (
            <button
              onClick={() => updateFilter('job_type', null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium badge-gray border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {JOB_TYPE_LABELS[filters.job_type as keyof typeof JOB_TYPE_LABELS]}
              <X className="h-3 w-3" />
            </button>
          )}
          {filters.location && (
            <button
              onClick={() => updateFilter('location', null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium badge-gray border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              📍 {filters.location}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Job grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : data?.results.length === 0 ? (
        <EmptyState
          title="No jobs found"
          description={hasActiveFilters ? "Try adjusting your filters or search terms." : "No jobs available right now. Check back soon!"}
          action={hasActiveFilters ? <button onClick={clearFilters} className="btn-primary">Clear Filters</button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.results.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => updateFilter('page', String(currentPage - 1))}
            className="btn-outline py-2 px-4 disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
            const page = i + 1
            return (
              <button
                key={page}
                onClick={() => updateFilter('page', String(page))}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                  page === currentPage
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'btn-outline py-0 px-0'
                }`}
              >
                {page}
              </button>
            )
          })}
          <button
            disabled={currentPage === totalPages}
            onClick={() => updateFilter('page', String(currentPage + 1))}
            className="btn-outline py-2 px-4 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
