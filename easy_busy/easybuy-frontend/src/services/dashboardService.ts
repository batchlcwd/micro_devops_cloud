import { delay } from '@/lib/http'
import type { DashboardStats } from '@/types'
import { db } from './mock/db'

export const dashboardService = {
  /** Aggregated client-side for now; a backend /api/admin/stats endpoint can replace it. */
  async getStats(): Promise<DashboardStats> {
    await delay()
    return {
      totalProducts: db.products.length,
      liveProducts: db.products.filter((p) => p.live).length,
      totalOrders: db.orders.length,
      pendingOrders: db.orders.filter((o) => o.status === 'PENDING').length,
      revenue: db.orders
        .filter((o) => o.payment.status === 'PAID' && o.status !== 'CANCELLED')
        .reduce((n, o) => n + o.totalAmount, 0),
      lowStockCount: db.inventory.filter((i) => i.availableQuantity > 0 && i.availableQuantity <= i.reorderLevel).length,
      outOfStockCount: db.inventory.filter((i) => i.availableQuantity <= 0).length,
    }
  },
}
