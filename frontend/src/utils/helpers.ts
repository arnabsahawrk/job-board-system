import type { JobType, JobCategory, ApplicationStatus } from '../types'

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  remote: 'Remote',
  contract: 'Contract',
  internship: 'Internship',
}

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  it: 'Information Technology',
  healthcare: 'Healthcare',
  finance: 'Finance',
  education: 'Education',
  marketing: 'Marketing',
  design: 'Design',
  other: 'Other',
}

export const JOB_CATEGORY_ICONS: Record<JobCategory, string> = {
  it: '💻',
  healthcare: '🏥',
  finance: '💰',
  education: '🎓',
  marketing: '📈',
  design: '🎨',
  other: '🌟',
}

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: 'badge-warning',
  reviewed: 'badge-primary',
  accepted: 'badge-success',
  rejected: 'badge-danger',
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

export function formatSalary(salary: number | null): string {
  if (!salary) return 'Not disclosed'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(salary)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeDate(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

export function getJobTypeBadgeClass(type: JobType): string {
  const map: Record<JobType, string> = {
    full_time: 'badge-success',
    part_time: 'badge-warning',
    remote: 'badge-primary',
    contract: 'badge-gray',
    internship: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 badge',
  }
  return map[type] || 'badge-gray'
}

export function buildFormData(obj: Record<string, unknown>): FormData {
  const fd = new FormData()
  Object.entries(obj).forEach(([k, v]) => {
    if (v instanceof File) fd.append(k, v)
    else if (v !== null && v !== undefined && v !== '') fd.append(k, String(v))
  })
  return fd
}

export function cloudinaryUrl(url: string | null, width = 400): string {
  if (!url) return ''
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`)
  }
  return url
}

export function getRatingStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}
