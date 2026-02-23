import api from './axios'
import type { ReviewListItem, ReviewDetail, ReviewStatistics, TopRecruiter, PaginatedResponse } from '../types'

export const reviewsApi = {
  list: (params?: { page?: number; recruiter?: number; job?: number; rating?: number; search?: string; ordering?: string }) =>
    api.get<PaginatedResponse<ReviewListItem>>('/reviews/', { params }),

  get: (id: number) => api.get<ReviewDetail>(`/reviews/${id}/`),

  create: (data: { job_id: number; rating: number; comment?: string }) =>
    api.post<ReviewDetail>('/reviews/', data),

  update: (id: number, data: { rating?: number; comment?: string }) =>
    api.patch<ReviewDetail>(`/reviews/${id}/`, data),

  delete: (id: number) => api.delete(`/reviews/${id}/`),

  recruiterReviews: (recruiterId: number, jobId?: number) =>
    api.get<ReviewListItem[]>('/reviews/recruiter_reviews/', {
      params: { recruiter_id: recruiterId, ...(jobId ? { job_id: jobId } : {}) },
    }),

  myReviews: () => api.get<ReviewListItem[]>('/reviews/my_reviews/'),

  myReceivedReviews: () => api.get<ReviewListItem[]>('/reviews/my_received_reviews/'),

  recruiterStatistics: (recruiterId: number) =>
    api.get<ReviewStatistics>('/reviews/recruiter_statistics/', {
      params: { recruiter_id: recruiterId },
    }),

  jobReviews: (jobId: number) =>
    api.get<ReviewListItem[]>('/reviews/job_reviews/', { params: { job_id: jobId } }),

  topRecruiters: (limit?: number) =>
    api.get<TopRecruiter[]>('/reviews/top_recruiters/', { params: { limit } }),

  toggleHelpful: (id: number) =>
    api.post<{ message: string; helpful_count: number }>(`/reviews/${id}/helpful/`),

  helpfulVotes: (id: number) =>
    api.get<{ review_id: number; helpful_count: number; is_helpful_by_current_user: boolean }>(
      `/reviews/${id}/helpful_votes/`
    ),
}
