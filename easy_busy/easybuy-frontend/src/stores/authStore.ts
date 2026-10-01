import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { setUnauthorizedHandler } from '@/lib/http'
import { tokenStorage } from '@/lib/tokenStorage'
import { authService } from '@/services'
import type { RegisterRequest, User } from '@/types'

interface AuthState {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  register: (req: RegisterRequest) => Promise<User>
  logout: () => void
}

/** Treat an expired JWT as signed out on startup. */
function tokenExpired(token: string | null) {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      login: async (email, password) => {
        const res = await authService.login(email, password)
        tokenStorage.set(res.accessToken, res.refreshToken)
        set({ user: res.user })
        return res.user
      },

      register: async (req) => {
        await authService.register(req)
        return get().login(req.email, req.password)
      },

      logout: () => {
        tokenStorage.clear()
        set({ user: null })
      },
    }),
    {
      name: 'easybuy-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        // Access token expired and no refresh token left → start signed out
        if (state?.user && tokenExpired(tokenStorage.getAccess()) && !tokenStorage.getRefresh()) state.logout()
      },
    },
  ),
)

setUnauthorizedHandler(() => {
  if (useAuthStore.getState().user) useAuthStore.getState().logout()
})

export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'ADMIN')
