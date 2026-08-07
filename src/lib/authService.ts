import { API_BASE_URL } from '@/lib/env'

const ACCESS_TOKEN_KEY = 'examprachar_admin_access_token'
const REFRESH_TOKEN_KEY = 'examprachar_admin_refresh_token'
export const AUTH_CHANGED_EVENT = 'examprachar:auth-changed'

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function clearToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? 'Invalid username or password.')
  }

  const data = await res.json()
  if (!data.access || !data.refresh) {
    throw new Error('Login response did not include tokens.')
  }
  setTokens(data.access, data.refresh)
}

export function logout(): void {
  clearToken()
}

let refreshPromise: Promise<string> | null = null

// Concurrent 401s all await the same in-flight refresh instead of racing separate calls,
// which would otherwise each rotate the refresh token and invalidate the others.
export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh = getRefreshToken()
    if (!refresh) {
      clearToken()
      throw new Error('No refresh token available.')
    }

    const res = await fetch(`${API_BASE_URL}/admin/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!res.ok) {
      clearToken()
      throw new Error('Session expired. Please sign in again.')
    }

    const data = await res.json()
    setTokens(data.access, data.refresh)
    return data.access as string
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}
