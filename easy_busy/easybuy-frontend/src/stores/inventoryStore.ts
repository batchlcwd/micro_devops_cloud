import { create } from 'zustand'
import { inventoryService } from '@/services'
import type { InventoryItem } from '@/types'

interface InventoryState {
  items: InventoryItem[]
  loading: boolean
  fetchInventory: () => Promise<void>
  updateStock: (id: number, patch: Pick<InventoryItem, 'availableQuantity' | 'reorderLevel'>) => Promise<InventoryItem>
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  loading: false,

  fetchInventory: async () => {
    set({ loading: true })
    try {
      set({ items: await inventoryService.getAll() })
    } finally {
      set({ loading: false })
    }
  },

  updateStock: async (id, patch) => {
    const updated = await inventoryService.update(id, patch)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
    return updated
  },
}))
