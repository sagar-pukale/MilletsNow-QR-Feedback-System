import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export const API_URL = import.meta.env.VITE_API_URL ?? ''
export type AuthUser = { id: string; email: string; fullName: string; role: string }
type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  loginSuccess: (user: AuthUser) => void
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loginSuccess = (loggedUser: AuthUser) => {
    setUser(loggedUser)
    setLoading(false)
  }

  const refresh = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      if (!response.ok) throw new Error('Unauthenticated')
      const body = (await response.json()) as { user: AuthUser }
      setUser(body.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
    } finally {
      setUser(null)
    }
  }

  useEffect(() => {
    let active = true
    const init = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, { credentials: 'include' })
        if (!response.ok) throw new Error('Unauthenticated')
        const body = (await response.json()) as { user: AuthUser }
        if (active) setUser(body.user)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    void init()
    return () => {
      active = false
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, loginSuccess, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
    }
  }, [loading, user, navigate, location.pathname])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] text-sm text-muted-foreground">
        Loading workspace…
      </div>
    )
  }

  return children
}
