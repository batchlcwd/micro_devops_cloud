import { effectivePrice, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '@/lib/pricing'
import type { Order, OrderStatus, OrderStatusEvent, PaymentMethod, PaymentStatus, ShippingAddress } from '@/types'
import { products } from './products'
import { demoAddress, demoCustomer } from './users'

const otherCustomers: { id: string; address: ShippingAddress }[] = [
  {
    id: 'u-1002',
    address: { fullName: 'Meera Iyer', phone: '9812345678', email: 'meera.iyer@example.com', line1: '14, Palm Grove Apartments', line2: 'Adyar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600020', country: 'India' },
  },
  {
    id: 'u-1003',
    address: { fullName: 'Kabir Singh', phone: '9988776655', email: 'kabir.singh@example.com', line1: 'B-42, Green Park Extension', city: 'New Delhi', state: 'Delhi', pincode: '110016', country: 'India' },
  },
  {
    id: 'u-1004',
    address: { fullName: 'Sneha Patil', phone: '9123456780', email: 'sneha.patil@example.com', line1: '7, Shanti Niwas, FC Road', city: 'Pune', state: 'Maharashtra', pincode: '411004', country: 'India' },
  },
]

const flow: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

function history(status: OrderStatus, createdAt: Date): OrderStatusEvent[] {
  const at = (h: number) => new Date(createdAt.getTime() + h * 3_600_000).toISOString()
  if (status === 'CANCELLED') {
    return [
      { status: 'PENDING', at: at(0) },
      { status: 'CONFIRMED', at: at(0.1) },
      { status: 'CANCELLED', at: at(5), note: 'Cancelled by customer' },
    ]
  }
  const idx = flow.indexOf(status)
  return flow.slice(0, idx + 1).map((s, i) => ({ status: s, at: at(i === 0 ? 0 : i * 26 - 25.9) }))
}

interface Seed {
  id: number
  userId: string
  address: ShippingAddress
  lines: [productIndex: number, qty: number][]
  status: OrderStatus
  paymentStatus: PaymentStatus
  method?: PaymentMethod
  daysAgo: number
}

const seeds: Seed[] = [
  { id: 1001, userId: demoCustomer.id, address: demoAddress, lines: [[0, 1], [9, 2]], status: 'DELIVERED', paymentStatus: 'PAID', daysAgo: 48 },
  { id: 1002, userId: otherCustomers[0].id, address: otherCustomers[0].address, lines: [[17, 3]], status: 'DELIVERED', paymentStatus: 'PAID', daysAgo: 30 },
  { id: 1003, userId: demoCustomer.id, address: demoAddress, lines: [[22, 1], [23, 1]], status: 'DELIVERED', paymentStatus: 'PAID', method: 'OFFLINE', daysAgo: 21 },
  { id: 1004, userId: otherCustomers[1].id, address: otherCustomers[1].address, lines: [[2, 1]], status: 'SHIPPED', paymentStatus: 'PAID', daysAgo: 6 },
  { id: 1005, userId: demoCustomer.id, address: demoAddress, lines: [[7, 1], [12, 1]], status: 'SHIPPED', paymentStatus: 'PAID', daysAgo: 4 },
  { id: 1006, userId: otherCustomers[2].id, address: otherCustomers[2].address, lines: [[14, 2], [13, 1]], status: 'CANCELLED', paymentStatus: 'REFUNDED', daysAgo: 4 },
  { id: 1007, userId: otherCustomers[0].id, address: otherCustomers[0].address, lines: [[1, 1]], status: 'CONFIRMED', paymentStatus: 'PAID', daysAgo: 2 },
  { id: 1008, userId: demoCustomer.id, address: demoAddress, lines: [[18, 1], [20, 1]], status: 'CONFIRMED', paymentStatus: 'PAID', daysAgo: 1 },
  { id: 1009, userId: otherCustomers[1].id, address: otherCustomers[1].address, lines: [[5, 2]], status: 'PENDING', paymentStatus: 'PENDING', method: 'OFFLINE', daysAgo: 0.5 },
  { id: 1010, userId: otherCustomers[2].id, address: otherCustomers[2].address, lines: [[10, 1], [15, 1]], status: 'PENDING', paymentStatus: 'FAILED', daysAgo: 0.2 },
]

const now = new Date('2026-10-01T09:00:00Z').getTime()

export const orders: Order[] = seeds.map((s) => {
  const createdAt = new Date(now - s.daysAgo * 86_400_000)
  const items = s.lines.map(([pi, qty], i) => {
    const p = products[pi]
    const unit = effectivePrice(p.price, p.discount)
    return {
      id: s.id * 10 + i,
      productId: p.id,
      productTitle: p.title,
      productImage: p.productImages[0],
      unitPrice: p.price,
      discountPercent: p.discount,
      quantity: qty,
      lineTotal: unit * qty,
    }
  })
  const mrp = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0)
  const subtotal = items.reduce((n, i) => n + i.lineTotal, 0)
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const statusHistory = history(s.status, createdAt)
  const method = s.method ?? 'ONLINE'
  const paid = s.paymentStatus === 'PAID' || s.paymentStatus === 'REFUNDED'
  return {
    id: s.id,
    orderNumber: `EB${createdAt.getFullYear()}${String(s.id).padStart(6, '0')}`,
    userId: s.userId,
    billingName: s.address.fullName,
    billingPhone: s.address.phone,
    shippingAddress: s.address,
    items,
    subtotal,
    discountTotal: mrp - subtotal,
    shippingFee,
    tax: 0,
    totalAmount: subtotal + shippingFee,
    status: s.status,
    payment: {
      method,
      status: s.paymentStatus,
      provider: method === 'ONLINE' ? 'RAZORPAY' : undefined,
      razorpayOrderId: method === 'ONLINE' ? `order_Mk${s.id}Qx7Lp2aZ` : undefined,
      razorpayPaymentId: method === 'ONLINE' && paid ? `pay_Nq${s.id}Ty4Wb8cR` : undefined,
      transactionId: method === 'ONLINE' ? `txn_${s.id}a9f3` : undefined,
      paidAt: paid ? statusHistory[0].at : undefined,
    },
    statusHistory,
    createdAt: createdAt.toISOString(),
    updatedAt: statusHistory[statusHistory.length - 1].at,
    cancelledAt: s.status === 'CANCELLED' ? statusHistory[statusHistory.length - 1].at : undefined,
  }
})
