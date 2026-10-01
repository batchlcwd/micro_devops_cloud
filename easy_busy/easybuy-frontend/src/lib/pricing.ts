import type { CartItem, InventoryItem, Review, StockStatus } from '@/types'

/** Same rounding as cart-order-service: price × (100 − discount) / 100, 2 decimals. */
export const effectivePrice = (price: number, discount = 0) => Math.round(price * (100 - discount)) / 100

/** Recover the MRP from a discounted unit price (cart/order lines only carry the final price). */
export const mrpFromUnit = (unitPrice: number, discount = 0) =>
  discount > 0 && discount < 100 ? Math.round((unitPrice * 100) / (100 - discount) * 100) / 100 : unitPrice

export interface CartTotals {
  itemCount: number
  mrpTotal: number
  discountTotal: number
  /** What the backend will charge: Σ unitPrice × quantity (no shipping fee) */
  total: number
}

export function computeTotals(items: Pick<CartItem, 'unitPrice' | 'discount' | 'quantity'>[]): CartTotals {
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)
  const total = round2(items.reduce((n, i) => n + i.unitPrice * i.quantity, 0))
  const mrpTotal = round2(items.reduce((n, i) => n + mrpFromUnit(i.unitPrice, i.discount) * i.quantity, 0))
  return { itemCount, mrpTotal, discountTotal: round2(mrpTotal - total), total }
}

export const round2 = (n: number) => Math.round(n * 100) / 100

export function stockStatus(item: Pick<InventoryItem, 'availableQuantity' | 'reorderLevel'> | null | undefined): StockStatus {
  if (!item || item.availableQuantity <= 0) return 'OUT_OF_STOCK'
  if (item.availableQuantity <= item.reorderLevel) return 'LOW_STOCK'
  return 'IN_STOCK'
}

export function averageRating(reviews?: Review[]) {
  if (!reviews?.length) return { rating: 0, count: 0 }
  const rating = reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
  return { rating: Math.round(rating * 10) / 10, count: reviews.length }
}
