import { AlertTriangle, ArrowRight, IndianRupee, Package, ShoppingCart } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StatCard } from '@/components/admin/StatCard'
import { ErrorState } from '@/components/common/ErrorState'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { PageHeader } from '@/components/common/PageHeader'
import { OrderStatusBadge, PaymentStatusBadge, StockBadge } from '@/components/common/StatusBadges'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, formatPrice } from '@/lib/format'
import { isOrderActive, shortOrderNumber } from '@/lib/orderStatus'
import { stockStatus } from '@/lib/pricing'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useOrderStore } from '@/stores/orderStore'
import { useProductStore } from '@/stores/productStore'
import { ORDER_STATUSES } from '@/types'

export function DashboardPage() {
  useDocumentTitle('Admin dashboard')
  const navigate = useNavigate()
  const { allOrders, allOrdersLoading, error: ordersError, fetchAllOrders } = useOrderStore()
  const { items: inventory, loading: invLoading, error: invError, fetchInventory } = useInventoryStore()
  const { adminProducts, adminLoading, fetchAdminProducts } = useProductStore()

  const load = () => {
    fetchAllOrders()
    fetchInventory()
    fetchAdminProducts().catch(() => {})
  }
  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ordersReady = !(allOrdersLoading && allOrders.length === 0)
  const invReady = !(invLoading && inventory.length === 0)
  const productsReady = !(adminLoading && adminProducts.length === 0)

  const revenue = allOrders.filter((o) => o.paymentStatus === 'PAID' && o.status !== 'CANCELLED').reduce((n, o) => n + Number(o.totalAmount), 0)
  const openOrders = allOrders.filter(isOrderActive).length
  const lowCount = inventory.filter((i) => stockStatus(i) === 'LOW_STOCK').length
  const outCount = inventory.filter((i) => stockStatus(i) === 'OUT_OF_STOCK').length
  const lowStock = inventory
    .filter((i) => stockStatus(i) !== 'IN_STOCK')
    .sort((a, b) => a.availableQuantity - b.availableQuantity)
    .slice(0, 6)
  const imageFor = (productId: string) => adminProducts.find((p) => p.id === productId)?.productImages?.[0]
  const statusCounts = ORDER_STATUSES.map((st) => ({ status: st, count: allOrders.filter((o) => o.status === st).length }))
  const maxCount = Math.max(1, ...statusCounts.map((c) => c.count))

  if (ordersError && invError && allOrders.length === 0) {
    return <ErrorState message={ordersError} onRetry={load} />
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your store's performance" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" icon={IndianRupee} loading={!ordersReady} value={formatPrice(revenue)} hint="Paid, non-cancelled orders" />
        <StatCard label="Total orders" icon={ShoppingCart} loading={!ordersReady} value={String(allOrders.length)} hint={`${openOrders} in progress`} />
        <StatCard label="Total products" icon={Package} loading={!productsReady} value={String(adminProducts.length)} hint={`${adminProducts.filter((p) => p.live).length} live in store`} />
        <StatCard label="Low stock alerts" icon={AlertTriangle} loading={!invReady} value={String(lowCount + outCount)} hint={`${outCount} out of stock`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest purchases across the store</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/orders">View all <ArrowRight data-icon="inline-end" /></Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {ordersError && allOrders.length === 0 ? (
              <p className="text-sm text-destructive">{ordersError}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!ordersReady
                    ? Array.from({ length: 5 }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell>
                        </TableRow>
                      ))
                    : allOrders.length === 0
                      ? (
                          <TableRow>
                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No orders yet</TableCell>
                          </TableRow>
                        )
                      : allOrders.slice(0, 6).map((o) => (
                          <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                            <TableCell className="font-medium">#{shortOrderNumber(o.orderNumber)}</TableCell>
                            <TableCell>{o.billingName}</TableCell>
                            <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(o.createdAt)}</TableCell>
                            <TableCell><PaymentStatusBadge status={o.paymentStatus} /></TableCell>
                            <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                            <TableCell className="text-right font-medium tabular-nums">{formatPrice(o.totalAmount)}</TableCell>
                          </TableRow>
                        ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Low stock products</CardTitle>
              <CardDescription>At or below reorder level</CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/inventory?filter=low">Manage</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {invError && inventory.length === 0 ? (
                <p className="text-sm text-destructive">{invError}</p>
              ) : !invReady ? (
                Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">All products are well stocked.</p>
              ) : (
                lowStock.map((i) => (
                  <div key={i.id} className="flex items-center gap-3">
                    <ImageWithFallback src={imageFor(i.productId)} alt="" className="size-10 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{i.productName}</div>
                      <div className="text-xs text-muted-foreground">{i.sku} · {i.availableQuantity} left</div>
                    </div>
                    <StockBadge status={stockStatus(i)} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders by status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusCounts.map(({ status, count }) => (
                <div key={status} className="grid grid-cols-[136px_1fr_28px] items-center gap-3 text-sm">
                  <OrderStatusBadge status={status} />
                  <div className="h-2 overflow-hidden rounded-full bg-muted" title={`${count} orders`}>
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${(count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-right text-muted-foreground tabular-nums">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
