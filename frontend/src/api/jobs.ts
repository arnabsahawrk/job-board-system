import api from './axios'
import type { JobListItem, JobDetail, PaginatedResponse } from '../types'

export interface JobFilters {
  page?: number
  page_size?: number
  category?: string
  job_type?: string
  location?: string
  search?: string
  ordering?: string
}

export const jobsApi = {
  list: (filters?: JobFilters) =>
    api.get<PaginatedResponse<JobListItem>>('/jobs/', { params: filters }),

  get: (id: number) => api.get<JobDetail>(`/jobs/${id}/`),

  create: (data: FormData) =>
    api.post<JobDetail>('/jobs/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: FormData | Record<string, unknown>) =>
    api.patch<JobDetail>(`/jobs/${id}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),

  delete: (id: number) => api.delete(`/jobs/${id}/`),

  myJobs: () => api.get<JobListItem[]>('/jobs/my_jobs/'),

  similarJobs: (id: number) => api.get<JobListItem[]>(`/jobs/${id}/similar_jobs/`),
}
