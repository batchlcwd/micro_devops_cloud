import type { InventoryItem } from '@/types'
import { products } from './products'

/** Stock levels keyed by product number; a few are deliberately low / out of stock. */
const stock: Record<number, number> = {
  1: 42, 2: 18, 3: 7, 4: 0, 5: 64, 6: 120, 7: 4, 8: 35, 9: 0, 10: 310, 11: 22, 12: 3,
  13: 88, 14: 15, 15: 140, 16: 9, 17: 2, 18: 500, 19: 26, 20: 0, 21: 75, 22: 6, 23: 230, 24: 95, 25: 0,
}

const warehouses = ['BLR-WH-01', 'DEL-WH-02', 'MUM-WH-01']

export const inventory: InventoryItem[] = products.map((p, i) => ({
  id: i + 1,
  productId: p.id,
  sku: `EB-${p.categories[0].title.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
  productName: p.title,
  warehouseLocation: warehouses[i % warehouses.length],
  availableQuantity: stock[i + 1] ?? 50,
  reservedQuantity: i % 4 === 0 ? 2 : 0,
  reorderLevel: 10,
  active: p.live,
  updatedAt: p.updatedAt,
}))
