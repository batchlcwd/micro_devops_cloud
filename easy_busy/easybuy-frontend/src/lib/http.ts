/**
 * Fetch client for the Spring Cloud API Gateway.
 *
 * The gateway routes by service prefix and strips it before forwarding:
 *   /products/api/products/...    → products-service  /api/products/...
 *   /cart-orders/api/orders/...   → cart-order-service /api/orders/...
 * so every call names its service via `api.<service>`.
 *
 * In development VITE_API_BASE_URL defaults to `/gw`, which the Vite dev server
 * proxies to http://localhost:8080 (the gateway has no CORS configuration).
 */
import { tokenStorage } from './tokenStorage'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/gw').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Query = Record<string, string | number | boolean | undefined | null>

interface RequestOptions {
  query?: Query
  body?: unknown
  /** Skip the Authorization header (login, register, refresh) */
  anonymous?: boolean
}

let onUnauthorized: (() => void) | null = null
/** Registered by the auth store: called when the session can't be refreshed. */
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn
}

function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams()
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  const qs = params.toString()
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

async function parseError(res: Response): Promise<ApiError> {
  const text = await res.text().catch(() => '')
  let message = ''
  try {
    const json = JSON.parse(text)
    message = json.message ?? json.error ?? json.detail ?? ''
    if (!message && json.errors) message = Object.values(json.errors).join(', ')
  } catch {
    // Gateway filter errors are plain text, e.g. "Internal Server Error: Forbidden: ..."
    message = text.replace(/^Internal Server Error:\s*/, '')
  }
  if (!message) {
    message =
      res.status === 401 ? 'Please sign in to continue'
        : res.status === 403 ? 'You do not have permission to do that'
          : res.status === 404 ? 'Not found'
            : res.status >= 500 ? 'The server is unavailable. Please try again shortly.'
              : res.statusText || 'Request failed'
  }
  return new ApiError(res.status, message)
}

let refreshing: Promise<boolean> | null = null

/** POST /users/api/users/refresh — rotates both tokens. Concurrent 401s share one refresh. */
function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefresh()
  if (!refreshToken) return Promise.resolve(false)
  refreshing ??= fetch(buildUrl('/users/api/users/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) return false
      const data = (await res.json()) as { accessToken: string; refreshToken: string }
      tokenStorage.set(data.accessToken, data.refreshToken)
      return true
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
  const token = opts.anonymous ? null : tokenStorage.getAccess()
  let res: Response
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers: {
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the API gateway running?')
  }

  if (res.status === 401 && token && !retried) {
    if (await refreshTokens()) return request<T>(method, path, opts, true)
    onUnauthorized?.()
  }
  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}

function client(prefix: string) {
  return {
    get: <T>(path: string, query?: Query, o?: Omit<RequestOptions, 'query' | 'body'>) => request<T>('GET', prefix + path, { ...o, query }),
    post: <T>(path: string, body?: unknown, o?: Omit<RequestOptions, 'body'>) => request<T>('POST', prefix + path, { ...o, body }),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', prefix + path, { body }),
    patch: <T>(path: string, body?: unknown, query?: Query) => request<T>('PATCH', prefix + path, { body, query }),
    delete: <T>(path: string) => request<T>('DELETE', prefix + path),
  }
}

/** One client per gateway route (see api-gateway RouteConfig). */
export const api = {
  products: client('/products/api'),
  cartOrders: client('/cart-orders/api'),
  users: client('/users/api'),
  inventories: client('/inventories/api'),
  payments: client('/payments/api'),
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')
