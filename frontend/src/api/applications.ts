import api from './axios'
import type {
  ApplicationListItem,
  ApplicationDetail,
  ApplicationFeedback,
  StatusSummary,
  PaginatedResponse,
  User,
} from '../types'

export const applicationsApi = {
  list: (params?: { page?: number; job?: number; status?: string; search?: string }) =>
    api.get<PaginatedResponse<ApplicationListItem>>('/applications/', { params }),

  get: (id: number) => api.get<ApplicationDetail>(`/applications/${id}/`),

  create: (data: FormData) =>
    api.post<ApplicationDetail>('/applications/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: number) => api.delete(`/applications/${id}/`),

  myApplications: () => api.get<ApplicationListItem[]>('/applications/my_applications/'),

  jobApplications: (jobId?: number) =>
    api.get<ApplicationListItem[]>('/applications/job_applications/', {
      params: jobId ? { job_id: jobId } : undefined,
    }),

  updateStatus: (id: number, status: string, feedback_text: string) =>
    api.post(`/applications/${id}/update_status/`, { status, feedback_text }),

  applicantProfile: (id: number) => api.get<User>(`/applications/${id}/applicant_profile/`),

  feedback: (id: number) => api.get<ApplicationFeedback>(`/applications/${id}/feedback/`),

  statusSummary: () => api.get<StatusSummary>('/applications/status_summary/'),
}
