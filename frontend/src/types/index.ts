// ─── Auth Types ─────────────────────────────────────────────────────────────

export type UserRole = 'seeker' | 'recruiter'

export interface UserProfile {
  phone_number: string | null
  bio: string | null
  avatar: string | null
  skills: string | null
  experience: string | null
  experience_years: number
  resume: string | null
}

export interface User {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_verified: boolean
  is_active: boolean
  profile: UserProfile | null
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}

// ─── Job Types ───────────────────────────────────────────────────────────────

export type JobType = 'full_time' | 'part_time' | 'remote' | 'contract' | 'internship'
export type JobCategory = 'it' | 'healthcare' | 'finance' | 'education' | 'marketing' | 'design' | 'other'

export interface JobListItem {
  id: number
  title: string
  company_name: string
  company_logo: string | null
  location: string
  job_type: JobType
  category: JobCategory
  salary: number | null
  recruiter_name: string
  created_at: string
  updated_at: string
}

export interface JobDetail extends JobListItem {
  description: string
  requirements: string
  experience_required: number
  position_count: number
  application_deadline: string | null
  recruiter_email: string
}

export interface JobCreatePayload {
  title: string
  description: string
  requirements: string
  location: string
  job_type: JobType
  category: JobCategory
  company_name: string
  salary?: number
  experience_required?: number
  position_count?: number
  company_logo?: File
  application_deadline?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ─── Application Types ───────────────────────────────────────────────────────

export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected'

export interface ApplicationListItem {
  id: number
  job: number
  job_title: string
  job_company: string
  applicant_name: string
  applicant_email: string
  status: ApplicationStatus
  applied_at: string
  updated_at: string
}

export interface ApplicationDetail {
  id: number
  job: JobDetail
  applicant_name: string
  applicant_email: string
  applicant_phone: string | null
  applicant_bio: string | null
  resume: string | null
  cover_letter: string | null
  status: ApplicationStatus
  applied_at: string
  updated_at: string
}

export interface ApplicationFeedback {
  id: number
  application: number
  recruiter_name: string
  recruiter_email: string
  applicant_name: string
  applicant_email: string
  job_title: string
  feedback_text: string
  status_given: string
  created_at: string
  updated_at: string
}

export interface StatusSummary {
  total: number
  pending: number
  reviewed: number
  accepted: number
  rejected: number
}

// ─── Review Types ────────────────────────────────────────────────────────────

export interface ReviewListItem {
  id: number
  job: number
  job_title: string
  recruiter_name: string
  recruiter_email: string
  reviewer_name: string
  reviewer_email: string
  rating: number
  created_at: string
}

export interface ReviewDetail {
  id: number
  job: JobListItem
  job_title: string
  recruiter_name: string
  recruiter_email: string
  reviewer_name: string
  reviewer_email: string
  rating: number
  created_at: string
  comment: string | null
}

export interface ReviewStatistics {
  total_reviews: number
  average_rating: number
  five_star: number
  four_star: number
  three_star: number
  two_star: number
  one_star: number
}

export interface TopRecruiter {
  recruiter: number
  recruiter__full_name: string
  avg_rating: number
  review_count: number
}

// ─── Utility Types ───────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system'

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
