import api from './axios'
import type { User, LoginResponse } from '../types'

export const authApi = {
  register: (data: { full_name: string; email: string; role: string; password: string }) =>
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

  updateProfile: (data: FormData | Record<string, unknown>) =>
    api.patch<User>('/auth/update_profile/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),

  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post('/auth/change_password/', data),

  refreshToken: (refresh: string) => api.post('/auth/refresh_token/', { refresh }),
}
