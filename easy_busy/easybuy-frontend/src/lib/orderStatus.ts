import type { Order, OrderStatus } from '@/types'

/** Fulfilment pipeline as modelled by cart-order-service's OrderStatus enum. */
export const FULFILMENT_FLOW: OrderStatus[] = ['CONFIRMED', 'IN_PROGRESS', 'DISPATCHED', 'OUT_OF_DELIVERY', 'DELIVERED']

const labels: Record<OrderStatus, string> = {
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'Processing',
  DISPATCHED: 'Dispatched',
  OUT_OF_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export const orderStatusLabel = (s: OrderStatus) => labels[s] ?? s

/**
 * Statuses an admin may move an order to. The backend accepts any value, so the
 * UI enforces forward-only moves; cancelling is allowed until dispatch.
 */
export function allowedTransitions(current: OrderStatus): OrderStatus[] {
  const idx = FULFILMENT_FLOW.indexOf(current)
  if (idx < 0 || current === 'DELIVERED') return []
  const next = [FULFILMENT_FLOW[idx + 1]]
  if (idx <= FULFILMENT_FLOW.indexOf('IN_PROGRESS')) next.push('CANCELLED')
  return next
}

/** Orders still moving through fulfilment. */
export const isOrderActive = (o: Pick<Order, 'status'>) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'

/** Backend order numbers are UUIDs — show a short, readable form. */
export const shortOrderNumber = (orderNumber: string) => orderNumber.replace(/-/g, '').slice(0, 8).toUpperCase()
