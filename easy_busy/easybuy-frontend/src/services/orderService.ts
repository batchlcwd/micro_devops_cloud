import { api } from '@/lib/http'
import type { CheckoutRequest, Order, OrderStatus } from '@/types'

const newestFirst = (a: Order, b: Order) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')

/** cart-order-service orders via gateway route /cart-orders. */
export const orderService = {
  /** POST /api/orders/{userId}/checkout — checks out the user's server-side cart */
  checkout: (userId: string, req: CheckoutRequest) => api.cartOrders.post<Order>(`/orders/${userId}/checkout`, req),

  /** GET /api/orders/user/{userId} */
  async getByUser(userId: string): Promise<Order[]> {
    return (await api.cartOrders.get<Order[]>(`/orders/user/${userId}`)).sort(newestFirst)
  },

  /**
   * A customer's own order. The gateway rejects GET /api/orders/{orderId} for
   * non-admins (its ownership check reads the order id as a user id), so this
   * looks the order up in the user's order history instead.
   */
  async getForUser(userId: string, orderId: number): Promise<Order | null> {
    return (await orderService.getByUser(userId)).find((o) => o.id === orderId) ?? null
  },

  /** GET /api/orders (ADMIN) */
  async getAll(): Promise<Order[]> {
    return (await api.cartOrders.get<Order[]>('/orders')).sort(newestFirst)
  },

  /** GET /api/orders/{orderId} (ADMIN through the gateway) */
  getById: (orderId: number) => api.cartOrders.get<Order>(`/orders/${orderId}`),

  /** PATCH /api/orders/{orderId}/status?status= (ADMIN) — CANCELLED releases reserved stock */
  updateStatus: (orderId: number, status: OrderStatus) =>
    api.cartOrders.patch<Order>(`/orders/${orderId}/status`, undefined, { status }),
}
