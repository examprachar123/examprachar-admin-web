import { API_BASE_URL } from '@/lib/env'
import { getToken, getRefreshToken, clearToken, refreshAccessToken } from '@/lib/authService'

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string[]>

  constructor(status: number, message: string, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// On a 401, transparently refreshes the access token and retries once before giving up —
// callers never see the intermediate 401 unless the refresh itself fails.
async function authorizedFetch(url: string, init: RequestInit, isRetry = false): Promise<Response> {
  const token = getToken()
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (res.status === 401 && !isRetry && getRefreshToken()) {
    try {
      await refreshAccessToken()
      return authorizedFetch(url, init, true)
    } catch {
      // refreshAccessToken already cleared tokens; fall through to the 401 response below.
    }
  }

  if (res.status === 401) {
    clearToken()
  }

  return res
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await authorizedFetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const fieldErrors = body?.errors as Record<string, string[]> | undefined
    const firstFieldMessage = fieldErrors ? Object.values(fieldErrors)[0]?.[0] : undefined
    const message = body?.detail ?? firstFieldMessage ?? `Request failed with status ${res.status}`
    throw new ApiError(res.status, message, fieldErrors)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

function request<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchJson<T>(`${API_BASE_URL}${path}`, init)
}

async function requestForm<T>(path: string, form: FormData): Promise<T> {
  // No Content-Type here — the browser sets multipart/form-data with the right boundary.
  const res = await authorizedFetch(`${API_BASE_URL}${path}`, { method: 'POST', body: form })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const fieldErrors = body?.errors as Record<string, string[]> | undefined
    const firstFieldMessage = fieldErrors ? Object.values(fieldErrors)[0]?.[0] : undefined
    const message = body?.detail ?? firstFieldMessage ?? `Request failed with status ${res.status}`
    throw new ApiError(res.status, message, fieldErrors)
  }

  return res.json() as Promise<T>
}

async function getAllPages<T>(path: string): Promise<T[]> {
  let url: string | null = `${API_BASE_URL}${path}`
  const items: T[] = []
  while (url) {
    const page: PaginatedResponse<T> = await fetchJson<PaginatedResponse<T>>(url)
    items.push(...page.results)
    url = page.next
  }
  return items
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  getPage: <T>(path: string) => request<PaginatedResponse<T>>(path),
  getAllPages: <T>(path: string) => getAllPages<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, form: FormData) => requestForm<T>(path, form),
}
