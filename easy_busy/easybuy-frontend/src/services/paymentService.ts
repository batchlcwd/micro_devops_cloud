import { api } from '@/lib/http'
import type { Order, PaymentTransaction, RazorpayOrderResponse, RazorpayVerificationRequest } from '@/types'
import { mockRazorpayGateway } from './payment/mockRazorpayGateway'
import { razorpayGateway } from './payment/razorpayGateway'
import type { RazorpayCheckoutOptions, RazorpaySuccessResponse } from './payment/types'

export { PaymentError } from './payment/types'

/** payment-service runs in simulation mode with dummy keys and returns ids like `order_MOCK_1A2B3C4D`. */
export const isMockRazorpayOrder = (razorpayOrderId: string) => razorpayOrderId.startsWith('order_MOCK_')

/** payment-service via gateway route /payments. */
export const paymentService = {
  /** POST /api/payments/razorpay/create-order?orderId=&amount= */
  createRazorpayOrder: (order: Order) =>
    api.payments.post<RazorpayOrderResponse>('/payments/razorpay/create-order', undefined, {
      query: { orderId: order.id, amount: order.totalAmount },
    }),

  /**
   * Opens checkout. Simulated Razorpay orders (dummy backend keys) use the in-app
   * test dialog; real ones load Razorpay's checkout.js with the key from the backend.
   */
  openCheckout(rzpOrder: RazorpayOrderResponse, order: Order, email?: string): Promise<RazorpaySuccessResponse> {
    const options: RazorpayCheckoutOptions = {
      key: rzpOrder.keyId,
      amount: Math.round(rzpOrder.amount * 100),
      currency: rzpOrder.currency,
      name: 'EasyBuy',
      description: `Order #${order.orderNumber.slice(0, 8).toUpperCase()}`,
      order_id: rzpOrder.razorpayOrderId,
      prefill: { name: order.billingName, email, contact: order.billingPhone },
      notes: { orderId: String(order.id), transactionId: rzpOrder.transactionId },
      theme: { color: '#171717' },
    }
    const forceMock = import.meta.env.VITE_PAYMENT_GATEWAY === 'mock'
    const gateway = forceMock || isMockRazorpayOrder(rzpOrder.razorpayOrderId) ? mockRazorpayGateway : razorpayGateway
    return gateway.open(options)
  },

  /** POST /api/payments/razorpay/verify — marks the transaction PAID and notifies cart-order-service via Kafka */
  verifyPayment: (req: RazorpayVerificationRequest) => api.payments.post<PaymentTransaction>('/payments/razorpay/verify', req),

  /** GET /api/payments/order/{orderId} */
  getByOrder: (orderId: number) => api.payments.get<PaymentTransaction[]>(`/payments/order/${orderId}`),
}
