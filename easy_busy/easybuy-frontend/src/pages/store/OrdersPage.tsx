import { ChevronRight, PackageOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { PageHeader } from '@/components/common/PageHeader'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/common/StatusBadges'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, formatPrice } from '@/lib/format'
import { useAuthStore } from '@/stores/authStore'
import { useOrderStore } from '@/stores/orderStore'

const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'In progress' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export function OrdersPage() {
  useDocumentTitle('My orders')
  const user = useAuthStore((s) => s.user)!
  const { myOrders, myOrdersLoading, fetchMyOrders } = useOrderStore()
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchMyOrders(user.id)
  }, [fetchMyOrders, user.id])

  const visible = myOrders.filter((o) =>
    filter === 'all' ? true : filter === 'active' ? ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(o.status) : o.status === filter,
  )

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="My orders" description="Track, manage and review your purchases" />

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          {filters.map((f) => <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {myOrdersLoading && myOrders.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={filter === 'all' ? 'No orders yet' : 'No orders here'}
          description={filter === 'all' ? "When you place an order, it'll show up here." : 'No orders match this filter.'}
          action={filter === 'all' && <Button asChild><Link to="/products">Start shopping</Link></Button>}
        />
      ) : (
        <div className="space-y-4">
          {visible.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b bg-muted/40 px-5 py-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Order number</div>
                  <div className="font-medium">#{order.orderNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Placed on</div>
                  <div className="font-medium">{formatDate(order.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-medium">{formatPrice(order.totalAmount)}</div>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <PaymentStatusBadge status={order.payment.status} />
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex -space-x-3">
                  {order.items.slice(0, 3).map((i) => (
                    <ImageWithFallback key={i.id} src={i.productImage} alt={i.productTitle} className="size-14 rounded-lg border-2 border-background" />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-sm font-medium">{order.items.map((i) => i.productTitle).join(', ')}</div>
                  <div className="text-xs text-muted-foreground">
                    {order.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
