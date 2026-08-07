import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authService from '@/lib/authService'
import { authApi, type AdminProfile } from '@/api/authApi'

interface AuthContextValue {
  isAuthenticated: boolean
  admin: AdminProfile | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())
  const [admin, setAdmin] = useState<AdminProfile | null>(null)

  useEffect(() => {
    const syncFromStorage = () => setIsAuthenticated(authService.isAuthenticated())
    window.addEventListener(authService.AUTH_CHANGED_EVENT, syncFromStorage)
    return () => window.removeEventListener(authService.AUTH_CHANGED_EVENT, syncFromStorage)
  }, [])

  // Re-checks admin status server-side on every new session (login, or an existing token
  // found at app load) rather than trusting the token's mere presence.
  useEffect(() => {
    if (!isAuthenticated) {
      setAdmin(null)
      return
    }
    let cancelled = false
    authApi
      .me()
      .then((profile) => {
        if (!cancelled) setAdmin(profile)
      })
      .catch(() => {
        if (!cancelled) authService.logout()
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const login = useCallback(async (username: string, password: string) => {
    await authService.login(username, password)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setIsAuthenticated(false)
  }, [])

  const value = useMemo(() => ({ isAuthenticated, admin, login, logout }), [isAuthenticated, admin, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
