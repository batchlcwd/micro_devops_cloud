/**
 * Thin fetch wrapper for the Spring Boot API gateway.
 * Not used while `USE_MOCKS` is true — services call the mock DB instead.
 * When switching to the real backend, services call `http.get('/api/products')` etc.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

/** Flip with VITE_USE_MOCKS=false once the gateway is reachable. */
export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Query = Record<string, string | number | boolean | undefined>

function buildUrl(path: string, query?: Query) {
  const url = new URL(API_BASE_URL + path)
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  })
  return url.toString()
}

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
  const token = localStorage.getItem('easybuy-token')
  const res = await fetch(buildUrl(path, query), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new ApiError(res.status, err.message ?? res.statusText)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const http = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, undefined, query),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

/** Simulated network latency for mock services. */
export const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms))
