import { api } from '@/lib/http'
import type { Order, PaymentTransaction, RazorpayOrderResponse, RazorpayVerificationRequest } from '@/types'
import { razorpayGateway } from './payment/razorpayGateway'
import { PaymentError, type RazorpayCheckoutOptions, type RazorpaySuccessResponse } from './payment/types'

export { PaymentError } from './payment/types'

/** payment-service via gateway route /payments. */
export const paymentService = {
  /** POST /api/payments/razorpay/create-order?orderId=&amount= → Razorpay order id + key id */
  createRazorpayOrder: (order: Order) =>
    api.payments.post<RazorpayOrderResponse>('/payments/razorpay/create-order', undefined, {
      query: { orderId: order.id, amount: order.totalAmount },
    }),

  /** Opens Razorpay Checkout for the order created by payment-service. */
  openCheckout(rzpOrder: RazorpayOrderResponse, order: Order, email?: string): Promise<RazorpaySuccessResponse> {
    // payment-service falls back to fake `order_MOCK_…` ids when it runs with dummy keys;
    // those can't be paid through Razorpay, so fail clearly instead of opening a broken checkout.
    if (rzpOrder.razorpayOrderId.startsWith('order_MOCK_')) {
      return Promise.reject(
        new PaymentError('failed', 'Online payments are not configured: payment-service is using dummy Razorpay keys.'),
      )
    }
    const key = rzpOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!key) {
      return Promise.reject(new PaymentError('failed', 'Razorpay key id is missing from the payment service response.'))
    }

    const options: RazorpayCheckoutOptions = {
      key,
      // Must match the Razorpay order amount (paise); payment-service creates it from the same total
      amount: Math.round(Number(rzpOrder.amount) * 100),
      currency: rzpOrder.currency || 'INR',
      name: 'EasyBuy',
      description: `Order #${order.orderNumber.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
      order_id: rzpOrder.razorpayOrderId,
      prefill: { name: order.billingName, email, contact: order.billingPhone },
      notes: { orderId: String(order.id), transactionId: rzpOrder.transactionId },
      theme: { color: '#3395ff' },
    }
    return razorpayGateway.open(options)
  },

  /**
   * POST /api/payments/razorpay/verify — HMAC signature check with the key secret.
   * Success marks the transaction PAID; failure returns 400 and the order is cancelled via Kafka.
   */
  verifyPayment: (req: RazorpayVerificationRequest) => api.payments.post<PaymentTransaction>('/payments/razorpay/verify', req),

  /** GET /api/payments/order/{orderId} */
  getByOrder: (orderId: number) => api.payments.get<PaymentTransaction[]>(`/payments/order/${orderId}`),
}
