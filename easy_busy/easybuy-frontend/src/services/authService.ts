import { demoAdmin, demoCustomer } from '@/data/users'
import { delay } from '@/lib/http'
import type { User, UserRole } from '@/types'

export const authService = {
  /** REST: POST /api/auth/login — mocked as a one-click demo login per role. */
  async loginAs(role: UserRole): Promise<{ user: User; token: string }> {
    await delay(400)
    const user = role === 'ADMIN' ? demoAdmin : demoCustomer
    return { user, token: `mock-jwt-${user.id}` }
  },
}
