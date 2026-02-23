import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://arnabsahawrk-jobly-backend.vercel.app/api').replace(/\/+$/, '')

const REFRESH_EXCLUDED_PATHS = [
  '/auth/login/',
  '/auth/register/',
  '/auth/verify_email/',
  '/auth/resend_verification/',
  '/auth/request_password_reset/',
  '/auth/confirm_password_reset/',
  '/auth/refresh_token/',
]

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false
  return REFRESH_EXCLUDED_PATHS.some((path) => url.includes(path))
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `JWT ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else if (token) resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh(originalRequest.url)) {
      const refreshToken = localStorage.getItem('refresh_token')

      // No refresh token means guest user — just reject, don't redirect.
      // Only attempt a redirect if we had an authenticated session that expired.
      if (!refreshToken) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `JWT ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh_token/`, {
          refresh: refreshToken,
        })
        const newAccessToken: string = data.access
        localStorage.setItem('access_token', newAccessToken)
        processQueue(null, newAccessToken)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `JWT ${newAccessToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed — the session is truly expired. Clear tokens and
        // dispatch a custom event so the app can navigate to /login cleanly
        // without a hard page reload (which breaks SPA state).
        processQueue(refreshError, null)
        clearTokens()
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

export default api
