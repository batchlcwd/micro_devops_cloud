const ACCESS = 'easybuy-access-token'
const REFRESH = 'easybuy-refresh-token'

/** JWTs issued by users-service. Kept outside the Zustand store so the HTTP client can read them without a cycle. */
export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS),
  getRefresh: () => localStorage.getItem(REFRESH),
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS, access)
    if (refresh) localStorage.setItem(REFRESH, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS)
    localStorage.removeItem(REFRESH)
  },
}
