import { create } from 'zustand'
import { orderService } from '@/services'
import type { CheckoutRequest, Order, OrderStatus, PaymentInfo } from '@/types'

interface OrderState {
  myOrders: Order[]
  myOrdersLoading: boolean
  allOrders: Order[]
  allOrdersLoading: boolean
  fetchMyOrders: (userId: string) => Promise<void>
  fetchAllOrders: () => Promise<void>
  placeOrder: (req: CheckoutRequest) => Promise<Order>
  applyPayment: (orderId: number, payment: Partial<PaymentInfo>) => Promise<Order>
  updateStatus: (orderId: number, status: OrderStatus, note?: string) => Promise<Order>
}

const upsert = (list: Order[], order: Order) =>
  list.some((o) => o.id === order.id) ? list.map((o) => (o.id === order.id ? order : o)) : [order, ...list]

export const useOrderStore = create<OrderState>((set) => ({
  myOrders: [],
  myOrdersLoading: false,
  allOrders: [],
  allOrdersLoading: false,

  fetchMyOrders: async (userId) => {
    set({ myOrdersLoading: true })
    try {
      set({ myOrders: await orderService.getByUser(userId) })
    } finally {
      set({ myOrdersLoading: false })
    }
  },

  fetchAllOrders: async () => {
    set({ allOrdersLoading: true })
    try {
      set({ allOrders: await orderService.getAll() })
    } finally {
      set({ allOrdersLoading: false })
    }
  },

  placeOrder: async (req) => {
    const order = await orderService.checkout(req)
    set((s) => ({ myOrders: upsert(s.myOrders, order), allOrders: upsert(s.allOrders, order) }))
    return order
  },

  applyPayment: async (orderId, payment) => {
    const order = await orderService.applyPaymentResult(orderId, payment)
    set((s) => ({ myOrders: upsert(s.myOrders, order), allOrders: upsert(s.allOrders, order) }))
    return order
  },

  updateStatus: async (orderId, status, note) => {
    const order = await orderService.updateStatus(orderId, status, note)
    set((s) => ({
      myOrders: s.myOrders.map((o) => (o.id === orderId ? order : o)),
      allOrders: s.allOrders.map((o) => (o.id === orderId ? order : o)),
    }))
    return order
  },
}))
