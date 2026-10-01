import { create } from 'zustand'
import { inventoryService } from '@/services'
import type { InventoryItem } from '@/types'

interface InventoryState {
  items: InventoryItem[]
  loading: boolean
  error: string | null
  fetchInventory: () => Promise<void>
  /** Sets available quantity (via adjust-stock delta) and reorder level (via PUT) as needed. */
  updateStock: (item: InventoryItem, availableQuantity: number, reorderLevel: number) => Promise<InventoryItem>
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchInventory: async () => {
    set({ loading: true, error: null })
    try {
      set({ items: await inventoryService.getAll() })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load inventory' })
    } finally {
      set({ loading: false })
    }
  },

  updateStock: async (item, availableQuantity, reorderLevel) => {
    let updated = item
    const delta = availableQuantity - item.availableQuantity
    if (delta !== 0) updated = await inventoryService.adjustStock(item.id, delta, 'Manual adjustment from admin dashboard')
    if (reorderLevel !== item.reorderLevel) updated = await inventoryService.update(item.id, { ...updated, reorderLevel })
    set((s) => ({ items: s.items.map((i) => (i.id === item.id ? updated : i)) }))
    return updated
  },
}))
