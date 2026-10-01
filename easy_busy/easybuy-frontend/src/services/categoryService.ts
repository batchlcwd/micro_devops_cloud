import { delay } from '@/lib/http'
import type { Category } from '@/types'
import { clone, db } from './mock/db'

export const categoryService = {
  /** REST: GET /api/categories */
  async getAll(): Promise<Category[]> {
    await delay(250)
    return clone(db.categories)
  },
}
