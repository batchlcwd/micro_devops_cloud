import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/http'
import { PaymentError, paymentService } from '@/services'
import { useAuthStore } from '@/stores/authStore'
import type { Order, PaymentTransaction } from '@/types'

/**
 * Razorpay flow for a placed order (payment-service):
 *   1. POST /razorpay/create-order   → Razorpay order id + key
 *   2. Razorpay Checkout (checkout.js) — the customer pays inside Razorpay's modal
 *   3. POST /razorpay/verify         → transaction PAID; cart-order-service is updated via Kafka
 * Resolves with the verified transaction, or null if payment didn't complete.
 */
export function useRazorpayPayment() {
  const email = useAuthStore((s) => s.user?.email)
  const [paying, setPaying] = useState(false)

  async function payForOrder(order: Order): Promise<PaymentTransaction | null> {
    setPaying(true)
    try {
      const rzpOrder = await paymentService.createRazorpayOrder(order)
      const result = await paymentService.openCheckout(rzpOrder, order, email)
      const txn = await paymentService.verifyPayment({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      })
      if (txn.status !== 'PAID') throw new PaymentError('failed', 'Payment verification failed')
      toast.success('Payment successful', { description: 'Your order will be confirmed shortly.' })
      return txn
    } catch (e) {
      if (e instanceof PaymentError && e.reason === 'dismissed') {
        toast.warning('Payment cancelled', { description: 'Your order is saved — you can pay for it from My orders.' })
      } else {
        toast.error('Payment failed', { description: errorMessage(e) })
      }
      return null
    } finally {
      setPaying(false)
    }
  }

  return { payForOrder, paying }
}
