import { api } from '@/lib/http'
import type { CartResponse } from '@/types'

/**
 * cart-order-service carts via gateway route /cart-orders.
 * `userId` must be the signed-in user's UUID (the gateway compares it with the JWT `userId` claim).
 */
export const cartService = {
  /** GET /api/carts/{userId} — creates an empty cart if none exists */
  get: (userId: string) => api.cartOrders.get<CartResponse>(`/carts/${userId}`),

  /** POST /api/carts/{userId}/items — adds to the existing quantity */
  addItem: (userId: string, productId: string, quantity: number) =>
    api.cartOrders.post<CartResponse>(`/carts/${userId}/items`, { productId, quantity }),

  /** PUT /api/carts/{userId}/items/{productId} */
  updateItem: (userId: string, productId: string, quantity: number) =>
    api.cartOrders.put<CartResponse>(`/carts/${userId}/items/${productId}`, { quantity }),

  /** DELETE /api/carts/{userId}/items/{productId} */
  removeItem: (userId: string, productId: string) =>
    api.cartOrders.delete<CartResponse>(`/carts/${userId}/items/${productId}`),

  /** DELETE /api/carts/{userId} */
  clear: (userId: string) => api.cartOrders.delete<void>(`/carts/${userId}`),
}
