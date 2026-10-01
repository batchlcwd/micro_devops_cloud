import { delay } from '@/lib/http'
import { computeTotals, effectivePrice } from '@/lib/pricing'
import type { CheckoutRequest, Order, OrderStatus, PaymentInfo } from '@/types'
import { clone, db, persist } from './mock/db'

const nowIso = () => new Date().toISOString()

function findOrder(id: number) {
  const order = db.orders.find((o) => o.id === id)
  if (!order) throw new Error('Order not found')
  return order
}

function adjustStock(order: Order, direction: -1 | 1) {
  for (const item of order.items) {
    const inv = db.inventory.find((i) => i.productId === item.productId)
    if (inv) inv.availableQuantity = Math.max(0, inv.availableQuantity + direction * item.quantity)
  }
}

export const orderService = {
  /** REST: GET /api/orders/user/{userId} */
  async getByUser(userId: string): Promise<Order[]> {
    await delay()
    return clone(db.orders.filter((o) => o.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },

  /** REST: GET /api/orders (admin) */
  async getAll(): Promise<Order[]> {
    await delay()
    return clone([...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },

  /** REST: GET /api/orders/{orderId} */
  async getById(id: number): Promise<Order | null> {
    await delay(300)
    const order = db.orders.find((o) => o.id === id)
    return order ? clone(order) : null
  },

  /**
   * REST: POST /api/orders/{userId}/checkout
   * Creates the order in PENDING state and reserves stock (the backend does this
   * via inventory-service batch-reserve).
   */
  async checkout(req: CheckoutRequest): Promise<Order> {
    await delay(600)
    for (const item of req.items) {
      const inv = db.inventory.find((i) => i.productId === item.productId)
      if (!inv || inv.availableQuantity < item.quantity) {
        throw new Error(`Insufficient stock for "${item.title}"`)
      }
    }
    const totals = computeTotals(req.items)
    const id = Math.max(1000, ...db.orders.map((o) => o.id)) + 1
    const createdAt = nowIso()
    const order: Order = {
      id,
      orderNumber: `EB${new Date().getFullYear()}${String(id).padStart(6, '0')}`,
      userId: req.userId,
      billingName: req.shippingAddress.fullName,
      billingPhone: req.shippingAddress.phone,
      shippingAddress: req.shippingAddress,
      items: req.items.map((i, idx) => ({
        id: id * 10 + idx,
        productId: i.productId,
        productTitle: i.title,
        productImage: i.image,
        unitPrice: i.price,
        discountPercent: i.discount,
        quantity: i.quantity,
        lineTotal: effectivePrice(i.price, i.discount) * i.quantity,
      })),
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      shippingFee: totals.shippingFee,
      tax: 0,
      totalAmount: totals.total,
      status: 'PENDING',
      payment: {
        method: req.paymentMethod,
        status: 'PENDING',
        provider: req.paymentMethod === 'ONLINE' ? 'RAZORPAY' : undefined,
      },
      extraInformation: req.extraInformation,
      statusHistory: [{ status: 'PENDING', at: createdAt }],
      createdAt,
      updatedAt: createdAt,
    }
    // Cash on delivery orders are confirmed immediately
    if (req.paymentMethod === 'OFFLINE') {
      order.status = 'CONFIRMED'
      order.statusHistory.push({ status: 'CONFIRMED', at: createdAt, note: 'Cash on delivery' })
    }
    adjustStock(order, -1)
    db.orders.unshift(order)
    persist()
    return clone(order)
  },

  /** Called by the payment flow after verification (backend: payment-service → order event). */
  async applyPaymentResult(orderId: number, payment: Partial<PaymentInfo>): Promise<Order> {
    await delay(200)
    const order = findOrder(orderId)
    order.payment = { ...order.payment, ...payment }
    if (payment.status === 'PAID' && order.status === 'PENDING') {
      order.status = 'CONFIRMED'
      order.statusHistory.push({ status: 'CONFIRMED', at: nowIso(), note: 'Payment received' })
    }
    order.updatedAt = nowIso()
    persist()
    return clone(order)
  },

  /** REST: PATCH /api/orders/{orderId}/status (admin) */
  async updateStatus(orderId: number, status: OrderStatus, note?: string): Promise<Order> {
    await delay()
    const order = findOrder(orderId)
    if (order.status === status) return clone(order)
    if (status === 'CANCELLED') {
      adjustStock(order, 1)
      order.cancelledAt = nowIso()
      if (order.payment.status === 'PAID') order.payment.status = 'REFUNDED'
    }
    if (status === 'DELIVERED' && order.payment.method === 'OFFLINE') {
      order.payment.status = 'PAID'
      order.payment.paidAt = nowIso()
    }
    order.status = status
    order.statusHistory.push({ status, at: nowIso(), note })
    order.updatedAt = nowIso()
    persist()
    return clone(order)
  },

  /** REST: DELETE /api/orders/{orderId} (customer cancel) */
  async cancel(orderId: number): Promise<Order> {
    return orderService.updateStatus(orderId, 'CANCELLED', 'Cancelled by customer')
  },
}
