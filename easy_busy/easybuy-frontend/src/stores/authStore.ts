import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { setTokensRefreshedHandler, setUnauthorizedHandler } from '@/lib/http'
import { decodeToken } from '@/lib/jwt'
import { tokenStorage } from '@/lib/tokenStorage'
import { authService } from '@/services'
import type { RegisterRequest, User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  register: (req: RegisterRequest) => Promise<User>
  logout: () => void
  /**
   * Re-reads role / userId from the stored access token. The gateway authorises by
   * the token's claims, so the UI must agree with them — not with the role saved at login.
   */
  syncFromToken: () => void
}


export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      login: async (email, password) => {
        const res = await authService.login(email, password)
        tokenStorage.set(res.accessToken, res.refreshToken)
        set({ user: res.user })
        get().syncFromToken()
        return get().user!
      },

      register: async (req) => {
        await authService.register(req)
        return get().login(req.email, req.password)
      },

      logout: () => {
        tokenStorage.clear()
        set({ user: null })
      },

      syncFromToken: () => {
        const user = get().user
        if (!user) return
        const claims = decodeToken(tokenStorage.getAccess())
        if (!claims) {
          // Signed-in state without a usable token can only lead to 401/403s
          if (!tokenStorage.getRefresh()) get().logout()
          return
        }
        if (claims.userId && claims.userId !== user.id) {
          // Tokens belong to a different account than the stored profile — start clean
          get().logout()
          return
        }
        if (claims.role && claims.role !== user.role) set({ user: { ...user, role: claims.role as UserRole } })
      },
    }),
    {
      name: 'easybuy-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => state?.syncFromToken(),
    },
  ),
)

setUnauthorizedHandler(() => {
  if (useAuthStore.getState().user) useAuthStore.getState().logout()
})

setTokensRefreshedHandler(() => useAuthStore.getState().syncFromToken())

export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'ADMIN')
