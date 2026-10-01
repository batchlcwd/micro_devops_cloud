import { ArrowLeft, Loader2, PackageX } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { allowedTransitions } from '@/components/admin/OrderStatusSelect'
import { EmptyState } from '@/components/common/EmptyState'
import { orderStatusMeta, OrderStatusBadge } from '@/components/common/StatusBadges'
import { OrderItemsCard, OrderTotalsCard, PaymentCard, ShippingCard } from '@/components/order/OrderInfoCards'
import { OrderHistory, OrderProgress } from '@/components/order/OrderTimeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDateTime } from '@/lib/format'
import { orderService } from '@/services'
import { useOrderStore } from '@/stores/orderStore'
import type { Order, OrderStatus } from '@/types'

export function AdminOrderDetailsPage() {
  const { id } = useParams()
  const { data, loading } = useAsync(() => orderService.getById(Number(id)), [id])
  const updateStatus = useOrderStore((s) => s.updateStatus)
  const [override, setOverride] = useState<Order | null>(null)
  const [next, setNext] = useState<OrderStatus | ''>('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const order = override?.id === Number(id) ? override : data
  useDocumentTitle(order ? `Order #${order.orderNumber}` : 'Order')

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  if (!order) {
    return (
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
      const updated = await updateStatus(order!.id, next, note.trim() || 'Updated by admin')
      setOverride(updated)
      setNext('')
      setNote('')
      toast.success(`Status updated to ${orderStatusMeta[next].label}`)
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
        <h1 className="text-2xl font-semibold tracking-tight">Order #{order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
        <span className="w-full text-sm text-muted-foreground">
          Placed {formatDateTime(order.createdAt)} by {order.billingName} · Customer ID {order.userId}
        </span>
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
                        const Icon = orderStatusMeta[s].icon
                        return <SelectItem key={s} value={s}><Icon /> {orderStatusMeta[s].label}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Shipped via BlueDart AWB 12345" />
                </div>
                {next === 'CANCELLED' && (
                  <p className="rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    Cancelling restocks all items{order.payment.status === 'PAID' ? ' and marks the payment as refunded' : ''}.
                  </p>
                )}
                <Button className="w-full" onClick={save} disabled={!next || saving} variant={next === 'CANCELLED' ? 'destructive' : 'default'}>
                  {saving && <Loader2 className="animate-spin" />} Update status
                </Button>
              </CardContent>
            )}
          </Card>
          <OrderTotalsCard order={order} />
          <Card>
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
            <CardContent><OrderHistory order={order} /></CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
