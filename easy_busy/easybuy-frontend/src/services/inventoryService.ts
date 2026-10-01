import { api, ApiError } from '@/lib/http'
import type { CreateInventoryRequest, InventoryItem } from '@/types'

/**
 * inventory-service via gateway route /inventories.
 * Every call needs a signed-in user; writes need ADMIN.
 */
export const inventoryService = {
  /** GET /api/inventories (ADMIN) */
  getAll: () => api.inventories.get<InventoryItem[]>('/inventories'),

  /**
   * GET /api/inventories/product/{productId}
   * Returns null when the product has no stock record, or when the visitor is
   * signed out (the gateway requires a token for inventory reads).
   */
  async getByProductId(productId: string): Promise<InventoryItem | null> {
    try {
      return await api.inventories.get<InventoryItem>(`/inventories/product/${productId}`)
    } catch (e) {
      if (e instanceof ApiError && [401, 403, 404].includes(e.status)) return null
      throw e
    }
  },

  /** GET /api/inventories/low-stock?threshold= */
  getLowStock: (threshold = 10) => api.inventories.get<InventoryItem[]>('/inventories/low-stock', { threshold }),

  /** POST /api/inventories (ADMIN) */
  create: (req: CreateInventoryRequest) => api.inventories.post<InventoryItem>('/inventories', req),

  /** PATCH /api/inventories/{id}/adjust-stock — positive or negative delta (ADMIN) */
  adjustStock: (id: number, quantityDelta: number, reason?: string) =>
    api.inventories.patch<InventoryItem>(`/inventories/${id}/adjust-stock`, { quantityDelta, reason }),

  /** PUT /api/inventories/{id} — metadata only, not quantity (ADMIN) */
  update: (id: number, item: Pick<InventoryItem, 'productName' | 'warehouseLocation' | 'reorderLevel' | 'active'>) =>
    api.inventories.put<InventoryItem>(`/inventories/${id}`, {
      productName: item.productName,
      warehouseLocation: item.warehouseLocation,
      reorderLevel: item.reorderLevel,
      active: item.active,
    }),
}
