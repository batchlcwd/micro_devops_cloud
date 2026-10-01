import { ArrowLeft, Loader2, PackageX } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { OrderStatusBadge, orderStatusIcon } from '@/components/common/StatusBadges'
import { OrderItemsCard, OrderTotalsCard, PaymentCard, ShippingCard } from '@/components/order/OrderInfoCards'
import { OrderProgress } from '@/components/order/OrderTimeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDateTime } from '@/lib/format'
import { ApiError, errorMessage } from '@/lib/http'
import { allowedTransitions, orderStatusLabel, shortOrderNumber } from '@/lib/orderStatus'
import { orderService } from '@/services'
import { useOrderStore } from '@/stores/orderStore'
import type { Order, OrderStatus } from '@/types'

export function AdminOrderDetailsPage() {
  const { id } = useParams()
  const { data, loading, error, reload } = useAsync(() => orderService.getById(Number(id)), [id])
  const updateStatus = useOrderStore((s) => s.updateStatus)
  const [override, setOverride] = useState<Order | null>(null)
  const [next, setNext] = useState<OrderStatus | ''>('')
  const [saving, setSaving] = useState(false)

  const order = override?.id === Number(id) ? override : data
  useDocumentTitle(order ? `Order #${shortOrderNumber(order.orderNumber)}` : 'Order')

  if (loading && !order) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  if (!order) {
    return error && !(error instanceof ApiError && error.status === 404) ? (
      <ErrorState message={error.message} onRetry={reload} />
    ) : (
      <EmptyState
        icon={PackageX}
        title="Order not found"
        action={<Button asChild><Link to="/admin/orders">Back to orders</Link></Button>}
      />
    )
  }

  const allowed = allowedTransitions(order.status)

  async function save() {
    if (!next) return
    setSaving(true)
    try {
      setOverride(await updateStatus(order!.id, next))
      toast.success(`Status updated to ${orderStatusLabel(next)}`)
      setNext('')
    } catch (e) {
      toast.error('Could not update status', { description: errorMessage(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link to="/admin/orders"><ArrowLeft data-icon="inline-start" /> All orders</Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Order #{shortOrderNumber(order.orderNumber)}</h1>
        <OrderStatusBadge status={order.status} />
        <span className="w-full text-sm text-muted-foreground">
          Placed {formatDateTime(order.createdAt)} by {order.billingName}
        </span>
        <span className="w-full font-mono text-xs text-muted-foreground">Order ID {order.id} · {order.orderNumber} · User {order.userId}</span>
      </div>

      <Card className="mb-6">
        <CardContent className="py-2">
          <OrderProgress order={order} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <OrderItemsCard order={order} linkProducts={false} />
          <div className="grid gap-6 md:grid-cols-2">
            <ShippingCard order={order} />
            <PaymentCard order={order} />
          </div>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
              <CardDescription>
                {allowed.length ? 'Move this order to the next fulfilment stage.' : 'This order is in a final state.'}
              </CardDescription>
            </CardHeader>
            {allowed.length > 0 && (
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="next-status">New status</Label>
                  <Select value={next} onValueChange={(v) => setNext(v as OrderStatus)}>
                    <SelectTrigger id="next-status" className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {allowed.map((s) => {
                        const Icon = orderStatusIcon[s]
                        return <SelectItem key={s} value={s}><Icon /> {orderStatusLabel(s)}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {next === 'CANCELLED' && (
                  <p className="rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    Cancelling releases the reserved stock back to inventory.
                    {order.paymentStatus === 'PAID' && ' Refund the payment separately — there is no refund API yet.'}
                  </p>
                )}
                <Button className="w-full" onClick={save} disabled={!next || saving} variant={next === 'CANCELLED' ? 'destructive' : 'default'}>
                  {saving && <Loader2 className="animate-spin" />} Update status
                </Button>
              </CardContent>
            )}
          </Card>
          <OrderTotalsCard order={order} />
          {order.updatedAt && (
            <p className="text-xs text-muted-foreground">Last updated {formatDateTime(order.updatedAt)}</p>
          )}
        </div>
      </div>
    </>
  )
}
