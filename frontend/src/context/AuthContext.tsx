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

function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem('user')
    return stored ? (JSON.parse(stored) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => getStoredUser())
  const [isLoading, setIsLoading] = useState(true)

  const setUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser)
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser))
      return
    }
    localStorage.removeItem('user')
  }, [])

  const refreshUser = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    if (!accessToken && !refreshToken) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const { data } = await authApi.getProfile()
      setUser(data)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [setUser])

  useEffect(() => { refreshUser() }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password })
    setTokens(data.access, data.refresh)
    setUser(data.user)
  }, [setUser])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    finally {
      clearTokens()
      setUser(null)
    }
  }, [setUser])

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser, setUser }),
    [user, isLoading, login, logout, refreshUser, setUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
