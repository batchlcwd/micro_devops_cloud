import { delay } from '@/lib/http'
import type { Order, RazorpayOrderResponse, RazorpayVerificationRequest } from '@/types'
import { mockRazorpayGateway } from './payment/mockRazorpayGateway'
import { razorpayGateway } from './payment/razorpayGateway'
import type { PaymentGateway, RazorpayCheckoutOptions, RazorpaySuccessResponse } from './payment/types'

export { PaymentError } from './payment/types'

const gateway: PaymentGateway = import.meta.env.VITE_PAYMENT_GATEWAY === 'razorpay' ? razorpayGateway : mockRazorpayGateway

const randomId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 16)}`

export const paymentService = {
  /** REST: POST /api/payments/razorpay/create-order  { orderId, amount } */
  async createRazorpayOrder(order: Order): Promise<RazorpayOrderResponse> {
    await delay(400)
    return {
      razorpayOrderId: randomId('order'),
      transactionId: randomId('txn'),
      orderId: order.id,
      amount: order.totalAmount,
      currency: 'INR',
      keyId: import.meta.env.VITE_RAZORPAY_KEY_ID ?? 'rzp_test_mockKey123',
    }
  },

  /** Opens checkout (mock dialog or real Razorpay) and resolves with the handler payload. */
  openCheckout(rzpOrder: RazorpayOrderResponse, order: Order): Promise<RazorpaySuccessResponse> {
    const options: RazorpayCheckoutOptions = {
      key: rzpOrder.keyId,
      amount: Math.round(rzpOrder.amount * 100),
      currency: rzpOrder.currency,
      name: 'EasyBuy',
      description: `Order ${order.orderNumber}`,
      order_id: rzpOrder.razorpayOrderId,
      prefill: {
        name: order.shippingAddress.fullName,
        email: order.shippingAddress.email,
        contact: order.shippingAddress.phone,
      },
      notes: { orderNumber: order.orderNumber },
      theme: { color: '#171717' },
    }
    return gateway.open(options)
  },

  /** REST: POST /api/payments/razorpay/verify — the backend validates the HMAC signature. */
  async verifyPayment(req: RazorpayVerificationRequest): Promise<{ verified: boolean }> {
    await delay(500)
    return { verified: Boolean(req.razorpayPaymentId && req.razorpaySignature) }
  },
}
