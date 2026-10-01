import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { authService } from '@/services'
import type { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  loginAs: (role: UserRole) => Promise<User>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      loginAs: async (role) => {
        set({ loading: true })
        try {
          const { user, token } = await authService.loginAs(role)
          localStorage.setItem('easybuy-token', token)
          set({ user, token })
          return user
        } finally {
          set({ loading: false })
        }
      },
      logout: () => {
        localStorage.removeItem('easybuy-token')
        set({ user: null, token: null })
      },
    }),
    {
      name: 'easybuy-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
)

export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'ADMIN')
