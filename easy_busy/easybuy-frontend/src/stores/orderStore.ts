import { create } from 'zustand'
import { orderService } from '@/services'
import type { CheckoutRequest, Order, OrderStatus } from '@/types'

interface OrderState {
  myOrders: Order[]
  myOrdersLoading: boolean
  allOrders: Order[]
  allOrdersLoading: boolean
  error: string | null
  fetchMyOrders: (userId: string) => Promise<void>
  fetchAllOrders: () => Promise<void>
  placeOrder: (userId: string, req: CheckoutRequest) => Promise<Order>
  updateStatus: (orderId: number, status: OrderStatus) => Promise<Order>
}

const upsert = (list: Order[], order: Order) =>
  list.some((o) => o.id === order.id) ? list.map((o) => (o.id === order.id ? order : o)) : [order, ...list]

const message = (e: unknown) => (e instanceof Error ? e.message : 'Failed to load orders')

export const useOrderStore = create<OrderState>((set) => ({
  myOrders: [],
  myOrdersLoading: false,
  allOrders: [],
  allOrdersLoading: false,
  error: null,

  fetchMyOrders: async (userId) => {
    set({ myOrdersLoading: true, error: null })
    try {
      set({ myOrders: await orderService.getByUser(userId) })
    } catch (e) {
      set({ error: message(e) })
    } finally {
      set({ myOrdersLoading: false })
    }
  },

  fetchAllOrders: async () => {
    set({ allOrdersLoading: true, error: null })
    try {
      set({ allOrders: await orderService.getAll() })
    } catch (e) {
      set({ error: message(e) })
    } finally {
      set({ allOrdersLoading: false })
    }
  },

  placeOrder: async (userId, req) => {
    const order = await orderService.checkout(userId, req)
    set((s) => ({ myOrders: upsert(s.myOrders, order) }))
    return order
  },

  updateStatus: async (orderId, status) => {
    const order = await orderService.updateStatus(orderId, status)
    set((s) => ({
      myOrders: s.myOrders.map((o) => (o.id === orderId ? order : o)),
      allOrders: s.allOrders.map((o) => (o.id === orderId ? order : o)),
    }))
    return order
  },
}))
