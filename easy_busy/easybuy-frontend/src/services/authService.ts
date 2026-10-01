import { api } from '@/lib/http'
import type { LoginResponse, RegisterRequest, User } from '@/types'

/** users-service via gateway route /users. */
export const authService = {
  /** POST /api/users/login */
  login: (email: string, password: string) =>
    api.users.post<LoginResponse>('/users/login', { email, password }, { anonymous: true }),

  /** POST /api/users — new accounts are always created with role GUEST */
  register: (req: RegisterRequest) => api.users.post<User>('/users', req, { anonymous: true }),

  /** GET /api/users/{id} */
  getUser: (id: string) => api.users.get<User>(`/users/${id}`),
}
