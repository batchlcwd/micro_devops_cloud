import { CreditCard, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PriceBreakdown } from '@/components/checkout/PriceBreakdown'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { PaymentStatusBadge } from '@/components/common/StatusBadges'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useProductImages } from '@/hooks/useProductImages'
import { formatDateTime, formatPrice } from '@/lib/format'
import { computeTotals } from '@/lib/pricing'
import { paymentService } from '@/services'
import type { Order } from '@/types'

export function OrderItemsCard({ order, linkProducts = true }: { order: Order; linkProducts?: boolean }) {
  const images = useProductImages(order.items.map((i) => i.productId))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items ({order.items.length})</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <ImageWithFallback src={images[item.productId]} alt={item.productTitle} className="size-16 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              {linkProducts ? (
                <Link to={`/products/${item.productId}`} className="line-clamp-2 font-medium hover:underline">{item.productTitle}</Link>
              ) : (
                <span className="line-clamp-2 font-medium">{item.productTitle}</span>
              )}
              <div className="mt-1 text-xs text-muted-foreground">
                {formatPrice(item.unitPrice)} × {item.quantity}
                {item.discountPercent > 0 && <span className="ml-2 text-emerald-600 dark:text-emerald-400">{item.discountPercent}% off</span>}
              </div>
            </div>
            <div className="text-sm font-semibold">{formatPrice(item.lineTotal)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ShippingCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin className="size-4" /> Shipping details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <div className="font-medium">{order.billingName}</div>
        <div className="whitespace-pre-line text-muted-foreground">{order.shippingAddress}</div>
        <div className="flex items-center gap-1.5 pt-2 text-muted-foreground"><Phone className="size-3.5" /> {order.billingPhone}</div>
        {order.extraInformation && (
          <div className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Note: {order.extraInformation}</div>
        )}
      </CardContent>
    </Card>
  )
}

function Row({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={mono ? 'truncate font-mono text-xs leading-5' : 'text-right'}>{value}</span>
    </div>
  )
}

/** Order payment status plus the latest payment-service transaction for the order. */
export function PaymentCard({ order, refreshKey = 0 }: { order: Order; refreshKey?: number }) {
  const { data: txns, loading } = useAsync(() => paymentService.getByOrder(order.id).catch(() => []), [order.id, refreshKey])
  const latest = txns?.slice().sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CreditCard className="size-4" /> Payment details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 text-sm">
        <Row label="Status" value={<PaymentStatusBadge status={order.paymentStatus} />} />
        <Row label="Method" value={order.paymentMethod === 'ONLINE' ? 'Online · Razorpay' : 'Cash on delivery'} />
        {loading ? (
          <Skeleton className="h-12 w-full" />
        ) : latest ? (
          <>
            <Row label="Transaction" value={latest.transactionId} mono />
            <Row label="Gateway ref" value={latest.paymentGatewayTxnId} mono />
            <Row label="Last attempt" value={latest.createdAt && formatDateTime(latest.createdAt)} />
            {txns!.length > 1 && <p className="text-xs text-muted-foreground">{txns!.length} payment attempts recorded</p>}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No payment transactions recorded yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

export function OrderTotalsCard({ order }: { order: Order }) {
  const totals = computeTotals(order.items.map((i) => ({ unitPrice: i.unitPrice, discount: i.discountPercent, quantity: i.quantity })))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price details</CardTitle>
      </CardHeader>
      <CardContent>
        <PriceBreakdown itemCount={totals.itemCount} mrpTotal={totals.mrpTotal} discountTotal={totals.discountTotal} total={order.totalAmount} />
      </CardContent>
    </Card>
  )
}
