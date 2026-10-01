import { PaymentError, type PaymentGateway, type RazorpayCheckoutOptions, type RazorpaySuccessResponse } from './types'

/**
 * Real Razorpay Checkout integration. Enable with VITE_PAYMENT_GATEWAY=razorpay
 * once payment-service returns real Razorpay order ids and key ids.
 */

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

interface RazorpayInstance {
  open(): void
  on(event: 'payment.failed', cb: (res: { error: { description: string } }) => void): void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new PaymentError('failed', 'Unable to load Razorpay checkout'))
    document.body.appendChild(script)
  })
}

export const razorpayGateway: PaymentGateway = {
  async open(options: RazorpayCheckoutOptions) {
    await loadScript()
    return new Promise<RazorpaySuccessResponse>((resolve, reject) => {
      const rzp = new window.Razorpay!({
        ...options,
        handler: (res: RazorpaySuccessResponse) => resolve(res),
        modal: { ondismiss: () => reject(new PaymentError('dismissed', 'Payment cancelled')) },
      })
      rzp.on('payment.failed', (res) => reject(new PaymentError('failed', res.error.description)))
      rzp.open()
    })
  },
}
