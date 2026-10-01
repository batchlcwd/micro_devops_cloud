import { Eye, PackageOpen, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { orderStatusMeta, PaymentStatusBadge } from '@/components/common/StatusBadges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDateTime, formatPrice } from '@/lib/format'
import { useOrderStore } from '@/stores/orderStore'
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/types'

export function AdminOrdersPage() {
  useDocumentTitle('Orders')
  const [params, setParams] = useSearchParams()
  const statusFilter = params.get('status') ?? 'ALL'
  const { allOrders, allOrdersLoading, fetchAllOrders, updateStatus } = useOrderStore()
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    fetchAllOrders()
  }, [fetchAllOrders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allOrders.filter(
      (o) =>
        (statusFilter === 'ALL' || o.status === statusFilter) &&
        (!q || `${o.orderNumber} ${o.billingName} ${o.shippingAddress.email}`.toLowerCase().includes(q)),
    )
  }, [allOrders, statusFilter, search])

  const countFor = (s: string) => (s === 'ALL' ? allOrders.length : allOrders.filter((o) => o.status === s).length)

  async function changeStatus(order: Order, status: OrderStatus) {
    setUpdatingId(order.id)
    try {
      await updateStatus(order.id, status, 'Updated by admin')
      toast.success(`Order #${order.orderNumber} → ${orderStatusMeta[status].label}`)
    } catch (e) {
      toast.error('Could not update status', { description: e instanceof Error ? e.message : undefined })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <>
      <PageHeader title="Orders" description="View and fulfil customer orders" />

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="overflow-x-auto">
            <Tabs value={statusFilter} onValueChange={(v) => setParams(v === 'ALL' ? {} : { status: v })}>
              <TabsList>
                {['ALL', ...ORDER_STATUSES].map((s) => (
                  <TabsTrigger key={s} value={s}>
                    {s === 'ALL' ? 'All' : orderStatusMeta[s as OrderStatus].label} ({countFor(s)})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="relative xl:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order #, customer, email…" className="pl-9" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4"><span className="sr-only">View</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allOrdersLoading && allOrders.length === 0 ? (
                Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i}><TableCell colSpan={7} className="px-4"><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-6">
                    <EmptyState icon={PackageOpen} title="No orders found" description="No orders match the current filter." className="border-0 py-8" />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-4">
                      <Link to={`/admin/orders/${o.id}`} className="font-medium hover:underline">#{o.orderNumber}</Link>
                      <div className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{o.billingName}</div>
                      <div className="text-xs text-muted-foreground">{o.shippingAddress.city}</div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{o.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatPrice(o.totalAmount)}</TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={o.payment.status} />
                      <div className="mt-1 text-xs text-muted-foreground">{o.payment.method === 'ONLINE' ? 'Razorpay' : 'COD'}</div>
                    </TableCell>
                    <TableCell>
                      <OrderStatusSelect value={o.status} onChange={(s) => changeStatus(o, s)} disabled={updatingId === o.id} className="w-36" />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link to={`/admin/orders/${o.id}`} aria-label={`View order ${o.orderNumber}`}><Eye /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  )
}
