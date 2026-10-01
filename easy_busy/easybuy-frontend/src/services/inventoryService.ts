import { delay } from '@/lib/http'
import type { InventoryItem } from '@/types'
import { clone, db, persist } from './mock/db'

export const inventoryService = {
  /** REST: GET /api/inventories */
  async getAll(): Promise<InventoryItem[]> {
    await delay()
    return clone(db.inventory)
  },

  /** REST: GET /api/inventories/product/{productId} */
  async getByProductId(productId: string): Promise<InventoryItem | null> {
    await delay(200)
    const item = db.inventory.find((i) => i.productId === productId)
    return item ? clone(item) : null
  },

  /** REST: GET /api/inventories/low-stock */
  async getLowStock(): Promise<InventoryItem[]> {
    await delay()
    return clone(db.inventory.filter((i) => i.availableQuantity <= i.reorderLevel))
  },

  /** REST: PUT /api/inventories/{id} */
  async update(id: number, patch: Pick<InventoryItem, 'availableQuantity' | 'reorderLevel'>): Promise<InventoryItem> {
    await delay()
    const item = db.inventory.find((i) => i.id === id)
    if (!item) throw new Error('Inventory record not found')
    Object.assign(item, patch, { updatedAt: new Date().toISOString() })
    persist()
    return clone(item)
  },
}
