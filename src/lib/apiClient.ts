import { API_BASE_URL } from '@/lib/env'
import { getToken, getRefreshToken, clearToken, refreshAccessToken } from '@/lib/authService'

export class ApiError extends Error {
  status: number
  /** Raw `errors` object from the response body — shape varies (flat, nested, or per-row lists). */
  fieldErrors?: Record<string, unknown>
  /** Every individual error message, flattened and prefixed with a human-readable field path. */
  fieldMessages: string[]

  constructor(status: number, message: string, fieldErrors?: Record<string, unknown>, fieldMessages: string[] = []) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
    this.fieldMessages = fieldMessages
  }
}

function humanizeFieldName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Walks a DRF-style errors object of arbitrary shape (flat `{field: [msg]}`, nested objects,
 * or per-row lists like `{field: [{subfield: [msg]}, {}, ...]}`) into flat, readable strings.
 */
function flattenFieldErrors(node: unknown, path: string[] = []): string[] {
  if (typeof node === 'string') {
    const label = path
      .map((segment, i) => (segment.startsWith('#') ? ` ${segment}` : (i > 0 ? ' → ' : '') + humanizeFieldName(segment)))
      .join('')
    return [label ? `${label}: ${node}` : node]
  }
  if (Array.isArray(node)) {
    return node.flatMap((item, i) =>
      item && typeof item === 'object' && !Array.isArray(item)
        ? flattenFieldErrors(item, [...path, `#${i + 1}`])
        : flattenFieldErrors(item, path),
    )
  }
  if (node && typeof node === 'object') {
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => flattenFieldErrors(value, [...path, key]))
  }
  return []
}

function parseErrorBody(body: unknown, status: number): ApiError {
  const errors = (body as { errors?: unknown } | null)?.errors
  const fieldErrors = errors && typeof errors === 'object' && !Array.isArray(errors) ? (errors as Record<string, unknown>) : undefined
  const fieldMessages = fieldErrors ? flattenFieldErrors(fieldErrors) : []
  const detail = (body as { detail?: string } | null)?.detail
  const message = detail ?? fieldMessages[0] ?? `Request failed with status ${status}`
  return new ApiError(status, message, fieldErrors, fieldMessages)
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
    throw parseErrorBody(body, res.status)
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
    throw parseErrorBody(body, res.status)
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
