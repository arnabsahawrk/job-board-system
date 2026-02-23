import api from './axios'
import type { User, LoginResponse } from '../types'

export interface RegisterPayload {
  full_name: string
  email: string
  role: 'seeker' | 'recruiter'
  password: string
}

export interface UpdateProfilePayload {
  full_name?: string
  profile?: {
    phone_number?: string | null
    bio?: string | null
    skills?: string | null
    experience?: string | null
    avatar?: File | null
    resume?: File | null
  }
}

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post('/auth/register/', data),

  login: (data: { email: string; password: string }) =>
    api.post<LoginResponse>('/auth/login/', data),

  logout: () => api.post('/auth/logout/'),

  verifyEmail: (token: string) => api.post('/auth/verify_email/', { token }),

  resendVerification: (email: string) =>
    api.post('/auth/resend_verification/', { email }),

  requestPasswordReset: (email: string) =>
    api.post('/auth/request_password_reset/', { email }),

  confirmPasswordReset: (data: { uid: string; token: string; new_password: string }) =>
    api.post('/auth/confirm_password_reset/', data),

  getProfile: () => api.get<User>('/auth/profile/'),

  updateProfile: (data: FormData) =>
    api.patch<User>('/auth/update_profile/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post('/auth/change_password/', data),

  refreshToken: (refresh: string) => api.post('/auth/refresh_token/', { refresh }),
}
