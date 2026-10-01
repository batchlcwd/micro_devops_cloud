/** Subset of Razorpay Checkout options – see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/ */
export interface RazorpayCheckoutOptions {
  key: string
  /** Amount in the smallest currency unit (paise) */
  amount: number
  currency: string
  name: string
  description?: string
  image?: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  notes?: Record<string, string>
  theme?: { color?: string }
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export class PaymentError extends Error {
  reason: 'dismissed' | 'failed'
  constructor(reason: 'dismissed' | 'failed', message: string) {
    super(message)
    this.reason = reason
  }
}

/** A payment gateway opens checkout and resolves with Razorpay's handler payload. */
export interface PaymentGateway {
  open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResponse>
}
