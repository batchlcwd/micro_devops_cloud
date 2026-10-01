import { api } from '@/lib/http'
import type { Category } from '@/types'

export const categoryService = {
  /** GET /api/categories */
  getAll: () => api.products.get<Category[]>('/categories'),

  /** POST /api/categories (ADMIN) */
  create: (title: string) => api.products.post<Category>('/categories', { title }),
}
