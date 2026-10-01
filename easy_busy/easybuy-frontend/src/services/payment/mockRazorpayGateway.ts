import { useMockRazorpayStore } from '@/stores/mockRazorpayStore'
import type { PaymentGateway } from './types'

/**
 * Mock gateway: opens the in-app <MockRazorpayCheckout /> dialog instead of
 * Razorpay's hosted checkout. Same contract as the real gateway.
 */
export const mockRazorpayGateway: PaymentGateway = {
  open: (options) => useMockRazorpayStore.getState().request(options),
}
