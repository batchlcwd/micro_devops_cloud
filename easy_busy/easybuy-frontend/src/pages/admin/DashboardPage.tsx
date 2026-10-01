import { AlertTriangle, ArrowRight, IndianRupee, Package, ShoppingCart } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StatCard } from '@/components/admin/StatCard'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { PageHeader } from '@/components/common/PageHeader'
import { OrderStatusBadge, PaymentStatusBadge, StockBadge } from '@/components/common/StatusBadges'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, formatPrice } from '@/lib/format'
import { stockStatus } from '@/lib/pricing'
import { dashboardService } from '@/services'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useOrderStore } from '@/stores/orderStore'
import { useProductStore } from '@/stores/productStore'
import { ORDER_STATUSES } from '@/types'

export function DashboardPage() {
  useDocumentTitle('Admin dashboard')
  const navigate = useNavigate()
  const stats = useAsync(() => dashboardService.getStats(), [])
  const { allOrders, allOrdersLoading, fetchAllOrders } = useOrderStore()
  const { items: inventory, loading: invLoading, fetchInventory } = useInventoryStore()
  const { adminProducts, fetchAdminProducts } = useProductStore()

  useEffect(() => {
    fetchAllOrders()
    fetchInventory()
    fetchAdminProducts()
  }, [fetchAllOrders, fetchInventory, fetchAdminProducts])

  const s = stats.data
  const lowStock = inventory
    .filter((i) => stockStatus(i) !== 'IN_STOCK')
    .sort((a, b) => a.availableQuantity - b.availableQuantity)
    .slice(0, 6)
  const imageFor = (productId: string) => adminProducts.find((p) => p.id === productId)?.productImages[0]
  const statusCounts = ORDER_STATUSES.map((st) => ({ status: st, count: allOrders.filter((o) => o.status === st).length }))
  const maxCount = Math.max(1, ...statusCounts.map((c) => c.count))

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your store's performance" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" icon={IndianRupee} loading={stats.loading} value={s && formatPrice(s.revenue)} hint="From paid, non-cancelled orders" />
        <StatCard label="Total orders" icon={ShoppingCart} loading={stats.loading} value={s && String(s.totalOrders)} hint={s && `${s.pendingOrders} pending`} />
        <StatCard label="Total products" icon={Package} loading={stats.loading} value={s && String(s.totalProducts)} hint={s && `${s.liveProducts} live in store`} />
        <StatCard label="Low stock alerts" icon={AlertTriangle} loading={stats.loading} value={s && String(s.lowStockCount + s.outOfStockCount)} hint={s && `${s.outOfStockCount} out of stock`} />
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
                {allOrdersLoading && allOrders.length === 0
                  ? Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell>
                      </TableRow>
                    ))
                  : allOrders.slice(0, 6).map((o) => (
                      <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                        <TableCell className="font-medium">#{o.orderNumber}</TableCell>
                        <TableCell>{o.billingName}</TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(o.createdAt)}</TableCell>
                        <TableCell><PaymentStatusBadge status={o.payment.status} /></TableCell>
                        <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatPrice(o.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
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
              {invLoading && inventory.length === 0
                ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)
                : lowStock.length === 0
                  ? <p className="text-sm text-muted-foreground">All products are well stocked.</p>
                  : lowStock.map((i) => (
                      <div key={i.id} className="flex items-center gap-3">
                        <ImageWithFallback src={imageFor(i.productId)} alt="" className="size-10 shrink-0 rounded-md" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{i.productName}</div>
                          <div className="text-xs text-muted-foreground">{i.sku} · {i.availableQuantity} left</div>
                        </div>
                        <StockBadge status={stockStatus(i)} />
                      </div>
                    ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders by status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusCounts.map(({ status, count }) => (
                <div key={status} className="grid grid-cols-[110px_1fr_28px] items-center gap-3 text-sm">
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
