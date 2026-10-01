import { create } from 'zustand'
import { PaymentError, type RazorpayCheckoutOptions, type RazorpaySuccessResponse } from '@/services/payment/types'

interface MockRazorpayState {
  open: boolean
  options: RazorpayCheckoutOptions | null
  /** Opens the mock checkout; resolves/rejects like Razorpay's handler/ondismiss. */
  request: (options: RazorpayCheckoutOptions) => Promise<RazorpaySuccessResponse>
  succeed: () => void
  fail: (message?: string) => void
  dismiss: () => void
}

let pending: { resolve: (r: RazorpaySuccessResponse) => void; reject: (e: PaymentError) => void } | null = null

const rand = (n: number) => Math.random().toString(36).slice(2, 2 + n)

export const useMockRazorpayStore = create<MockRazorpayState>((set, get) => ({
  open: false,
  options: null,

  request: (options) =>
    new Promise((resolve, reject) => {
      pending = { resolve, reject }
      set({ open: true, options })
    }),

  succeed: () => {
    const opts = get().options
    pending?.resolve({
      razorpay_order_id: opts?.order_id ?? '',
      razorpay_payment_id: `pay_${rand(14)}`,
      razorpay_signature: rand(12) + rand(12) + rand(12),
    })
    pending = null
    set({ open: false })
  },

  fail: (message = 'Payment declined by bank') => {
    pending?.reject(new PaymentError('failed', message))
    pending = null
    set({ open: false })
  },

  dismiss: () => {
    pending?.reject(new PaymentError('dismissed', 'Payment cancelled'))
    pending = null
    set({ open: false })
  },
}))
