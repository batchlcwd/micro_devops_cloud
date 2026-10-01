import type { CartItem, InventoryItem, StockStatus } from '@/types'

export const FREE_SHIPPING_THRESHOLD = 999
export const SHIPPING_FEE = 49

export const effectivePrice = (price: number, discount = 0) => Math.round(price * (1 - discount / 100))

export interface CartTotals {
  itemCount: number
  mrpTotal: number
  discountTotal: number
  subtotal: number
  shippingFee: number
  total: number
}

export function computeTotals(items: CartItem[]): CartTotals {
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)
  const mrpTotal = items.reduce((n, i) => n + i.price * i.quantity, 0)
  const subtotal = items.reduce((n, i) => n + effectivePrice(i.price, i.discount) * i.quantity, 0)
  const shippingFee = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  return {
    itemCount,
    mrpTotal,
    discountTotal: mrpTotal - subtotal,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
  }
}

export function stockStatus(item: Pick<InventoryItem, 'availableQuantity' | 'reorderLevel'> | undefined): StockStatus {
  if (!item || item.availableQuantity <= 0) return 'OUT_OF_STOCK'
  if (item.availableQuantity <= item.reorderLevel) return 'LOW_STOCK'
  return 'IN_STOCK'
}
