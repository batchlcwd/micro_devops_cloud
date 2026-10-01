import { ArrowLeft, CheckCircle2, CreditCard, Loader2, PackageX, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EmptyState } from '@/components/common/EmptyState'
import { OrderStatusBadge } from '@/components/common/StatusBadges'
import { OrderItemsCard, OrderTotalsCard, PaymentCard, ShippingCard } from '@/components/order/OrderInfoCards'
import { OrderProgress } from '@/components/order/OrderTimeline'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRazorpayPayment } from '@/hooks/useRazorpayPayment'
import { formatDateTime, formatPrice } from '@/lib/format'
import { orderService } from '@/services'
import { useAuthStore } from '@/stores/authStore'
import { useOrderStore } from '@/stores/orderStore'
import type { Order } from '@/types'

export function OrderDetailsPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const justPlaced = params.get('placed') === '1'
  const user = useAuthStore((s) => s.user)
  const updateStatus = useOrderStore((s) => s.updateStatus)
  const { payForOrder, paying } = useRazorpayPayment()
  const [override, setOverride] = useState<Order | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const { data, loading } = useAsync(() => orderService.getById(Number(id)), [id])
  const order = override?.id === Number(id) ? override : data
  useDocumentTitle(order ? `Order #${order.orderNumber}` : 'Order')

  if (loading) {
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

  if (!order || (user?.role !== 'ADMIN' && order.userId !== user?.id)) {
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

  const canPay = order.payment.method === 'ONLINE' && ['PENDING', 'FAILED'].includes(order.payment.status) && order.status !== 'CANCELLED'
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status)

  async function retryPayment() {
    const updated = await payForOrder(order!)
    if (updated) setOverride(updated)
    else setOverride(await orderService.getById(order!.id))
  }

  async function cancelOrder() {
    setCancelling(true)
    try {
      setOverride(await updateStatus(order!.id, 'CANCELLED', 'Cancelled by customer'))
      toast.success('Order cancelled')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link to="/orders"><ArrowLeft data-icon="inline-start" /> All orders</Link>
      </Button>

      {justPlaced && order.payment.status !== 'FAILED' && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div>
            <div className="font-medium text-emerald-900 dark:text-emerald-200">Thank you! Your order has been placed.</div>
            <div className="text-sm text-emerald-800/80 dark:text-emerald-200/70">
              {order.payment.status === 'PAID'
                ? 'Payment received. We will notify you when it ships.'
                : order.payment.method === 'OFFLINE'
                  ? 'Please keep the exact amount ready at delivery.'
                  : 'Payment is pending — complete it below to confirm your order.'}
            </div>
          </div>
        </div>
      )}
      {order.payment.status === 'FAILED' && order.status !== 'CANCELLED' && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="text-sm">
            <div className="font-medium text-destructive">Payment failed</div>
            <div className="text-muted-foreground">Your order is on hold. Retry the payment to confirm it.</div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Order #{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed on {formatDateTime(order.createdAt)} · {formatPrice(order.totalAmount)}
          </p>
        </div>
        <div className="flex gap-2">
          {canPay && (
            <Button onClick={retryPayment} disabled={paying} className="bg-[#3395ff] text-white hover:bg-[#3395ff]/90">
              {paying ? <Loader2 className="animate-spin" /> : <CreditCard data-icon="inline-start" />}
              Pay {formatPrice(order.totalAmount)}
            </Button>
          )}
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={cancelling}>Cancel order</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {order.payment.status === 'PAID'
                      ? `A refund of ${formatPrice(order.totalAmount)} will be issued to your original payment method.`
                      : 'This action cannot be undone.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep order</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={cancelOrder}>Cancel order</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
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
          <PaymentCard order={order} />
        </div>
      </div>
    </div>
  )
}
