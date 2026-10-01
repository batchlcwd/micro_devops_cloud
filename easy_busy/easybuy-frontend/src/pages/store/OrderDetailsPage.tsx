import { ArrowLeft, CheckCircle2, CreditCard, Loader2, PackageX, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { OrderStatusBadge } from '@/components/common/StatusBadges'
import { OrderItemsCard, OrderTotalsCard, PaymentCard, ShippingCard } from '@/components/order/OrderInfoCards'
import { OrderProgress } from '@/components/order/OrderTimeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRazorpayPayment } from '@/hooks/useRazorpayPayment'
import { formatDateTime, formatPrice } from '@/lib/format'
import { shortOrderNumber } from '@/lib/orderStatus'
import { orderService } from '@/services'
import { useAuthStore } from '@/stores/authStore'

export function OrderDetailsPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const [params] = useSearchParams()
  const justPlaced = params.get('placed') === '1'
  const user = useAuthStore((s) => s.user)!
  const { payForOrder, paying } = useRazorpayPayment()

  const { data: order, loading, error, reload } = useAsync(
    () => (user.role === 'ADMIN' ? orderService.getById(orderId) : orderService.getForUser(user.id, orderId)),
    [orderId, user.id, user.role],
  )
  const [paymentRefresh, setPaymentRefresh] = useState(0)
  useDocumentTitle(order ? `Order #${shortOrderNumber(order.orderNumber)}` : 'Order')

  // Payment status reaches the order asynchronously (payment-service → Kafka → cart-order-service),
  // so poll a few times while an online payment is still pending.
  const pendingOnline = order?.paymentMethod === 'ONLINE' && order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED'
  const [polls, setPolls] = useState(0)
  useEffect(() => {
    if (!pendingOnline || polls >= 5) return
    const t = setTimeout(() => {
      reload()
      setPaymentRefresh((n) => n + 1)
      setPolls((n) => n + 1)
    }, 3000)
    return () => clearTimeout(t)
  }, [pendingOnline, polls, reload])

  if (loading && !order) {
    return (
      <div className="container mx-auto max-w-5xl space-y-4 px-4 py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-[1fr_340px]">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={PackageX}
          title="Order not found"
          description="We couldn't find this order in your account."
          action={<Button asChild><Link to="/orders">Back to orders</Link></Button>}
        />
      </div>
    )
  }

  async function pay() {
    await payForOrder(order!)
    reload()
    setPaymentRefresh((n) => n + 1)
    setPolls(0)
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link to="/orders"><ArrowLeft data-icon="inline-start" /> All orders</Link>
      </Button>

      {justPlaced && order.status !== 'CANCELLED' && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div>
            <div className="font-medium text-emerald-900 dark:text-emerald-200">Thank you! Your order has been placed.</div>
            <div className="text-sm text-emerald-800/80 dark:text-emerald-200/70">
              {order.paymentStatus === 'PAID'
                ? 'Payment received. We will notify you when it ships.'
                : order.paymentMethod === 'OFFLINE'
                  ? 'Please keep the amount ready at delivery.'
                  : 'We are confirming your payment — this usually takes a few seconds.'}
            </div>
          </div>
        </div>
      )}
      {order.paymentStatus === 'FAILED' && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="text-sm">
            <div className="font-medium text-destructive">Payment failed</div>
            <div className="text-muted-foreground">The payment for this order did not go through{order.status === 'CANCELLED' ? ', so the order was cancelled' : ''}.</div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Order #{shortOrderNumber(order.orderNumber)}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed on {formatDateTime(order.createdAt)} · {formatPrice(order.totalAmount)}
          </p>
        </div>
        {pendingOnline && (
          <Button onClick={pay} disabled={paying} className="bg-[#3395ff] text-white hover:bg-[#3395ff]/90">
            {paying ? <Loader2 className="animate-spin" /> : <CreditCard data-icon="inline-start" />}
            Pay {formatPrice(order.totalAmount)}
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="py-2">
          <OrderProgress order={order} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <OrderItemsCard order={order} />
          <ShippingCard order={order} />
        </div>
        <div className="space-y-6">
          <OrderTotalsCard order={order} />
          <PaymentCard order={order} refreshKey={paymentRefresh} />
          <p className="text-xs text-muted-foreground">
            Need to change or cancel this order? Contact support@easybuy.dev with your order number.
          </p>
        </div>
      </div>
    </div>
  )
}
