import { PaymentError, type PaymentGateway, type RazorpayCheckoutOptions, type RazorpaySuccessResponse } from './types'

/**
 * Razorpay Standard Checkout (checkout.js).
 * https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 *
 * Card / UPI / bank details are entered inside Razorpay's own frame and never
 * touch this app; we only receive the payment id + signature to verify server-side.
 */

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

interface RazorpayFailure {
  error: { code?: string; description?: string; reason?: string; metadata?: { payment_id?: string; order_id?: string } }
}

interface RazorpayInstance {
  open(): void
  on(event: 'payment.failed', cb: (res: RazorpayFailure) => void): void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      script.remove()
      reject(new PaymentError('failed', 'Could not load Razorpay. Check your internet connection or disable any ad blocker and try again.'))
    }
    document.body.appendChild(script)
  })
  return scriptPromise
}

export const razorpayGateway: PaymentGateway = {
  async open(options: RazorpayCheckoutOptions) {
    await loadScript()
    if (!window.Razorpay) throw new PaymentError('failed', 'Razorpay checkout is unavailable')

    return new Promise<RazorpaySuccessResponse>((resolve, reject) => {
      // Razorpay keeps its modal open after a failed attempt so the customer can retry
      // with another method. Only settle when they succeed or close the modal.
      let lastFailure: string | null = null

      const rzp = new window.Razorpay!({
        ...options,
        handler: (res: RazorpaySuccessResponse) => resolve(res),
        modal: {
          ondismiss: () =>
            reject(lastFailure ? new PaymentError('failed', lastFailure) : new PaymentError('dismissed', 'Payment cancelled')),
          escape: true,
          confirm_close: true,
        },
      })
      rzp.on('payment.failed', (res) => {
        lastFailure = res.error?.description || res.error?.reason || 'Payment failed'
      })
      rzp.open()
    })
  },
}
