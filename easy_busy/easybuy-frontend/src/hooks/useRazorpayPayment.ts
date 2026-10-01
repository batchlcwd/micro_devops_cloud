import { useState } from 'react'
import { toast } from 'sonner'
import { PaymentError, paymentService } from '@/services'
import { useOrderStore } from '@/stores/orderStore'
import type { Order } from '@/types'

/**
 * Orchestrates the Razorpay flow for an existing order:
 *   1. payment-service creates a Razorpay order
 *   2. checkout opens (mock dialog or real Razorpay)
 *   3. payment-service verifies the signature
 *   4. the order's payment status is updated
 * Returns the updated order, or null if payment did not complete.
 */
export function useRazorpayPayment() {
  const applyPayment = useOrderStore((s) => s.applyPayment)
  const [paying, setPaying] = useState(false)

  async function payForOrder(order: Order): Promise<Order | null> {
    setPaying(true)
    try {
      const rzpOrder = await paymentService.createRazorpayOrder(order)
      await applyPayment(order.id, {
        provider: 'RAZORPAY',
        razorpayOrderId: rzpOrder.razorpayOrderId,
        transactionId: rzpOrder.transactionId,
      })

      const result = await paymentService.openCheckout(rzpOrder, order)
      const { verified } = await paymentService.verifyPayment({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      })
      if (!verified) throw new PaymentError('failed', 'Payment verification failed')

      const updated = await applyPayment(order.id, {
        status: 'PAID',
        razorpayPaymentId: result.razorpay_payment_id,
        paidAt: new Date().toISOString(),
      })
      toast.success('Payment successful', { description: `Order ${order.orderNumber} is confirmed.` })
      return updated
    } catch (e) {
      if (e instanceof PaymentError && e.reason === 'dismissed') {
        toast.warning('Payment cancelled', { description: 'Your order is saved — you can complete payment from Orders.' })
      } else {
        await applyPayment(order.id, { status: 'FAILED' })
        toast.error('Payment failed', { description: e instanceof Error ? e.message : 'Please try again.' })
      }
      return null
    } finally {
      setPaying(false)
    }
  }

  return { payForOrder, paying }
}
