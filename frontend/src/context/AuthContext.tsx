import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '@/api/auth'
import { clearTokens, setTokens } from '@/api/axios'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { setUser(null); setIsLoading(false); return }
    try {
      const { data } = await authApi.getProfile()
      setUser(data)
      localStorage.setItem('user', JSON.stringify(data))
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { refreshUser() }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password })
    setTokens(data.access, data.refresh)
    setUser(data.user)
    localStorage.setItem('user', JSON.stringify(data.user))
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    finally {
      clearTokens()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser, setUser }),
    [user, isLoading, login, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
