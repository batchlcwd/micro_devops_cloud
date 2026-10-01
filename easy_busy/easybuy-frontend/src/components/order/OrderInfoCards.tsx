import { CreditCard, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PaymentStatusBadge } from '@/components/common/StatusBadges'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { PriceBreakdown } from '@/components/checkout/PriceBreakdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, formatPrice } from '@/lib/format'
import { effectivePrice } from '@/lib/pricing'
import type { Order } from '@/types'

export function OrderItemsCard({ order, linkProducts = true }: { order: Order; linkProducts?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items ({order.items.length})</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {order.items.map((item) => {
          const title = linkProducts ? (
            <Link to={`/products/${item.productId}`} className="line-clamp-2 font-medium hover:underline">{item.productTitle}</Link>
          ) : (
            <span className="line-clamp-2 font-medium">{item.productTitle}</span>
          )
          return (
            <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <ImageWithFallback src={item.productImage} alt={item.productTitle} className="size-16 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                {title}
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatPrice(effectivePrice(item.unitPrice, item.discountPercent))} × {item.quantity}
                  {item.discountPercent > 0 && <span className="ml-2 text-emerald-600 dark:text-emerald-400">{item.discountPercent}% off</span>}
                </div>
              </div>
              <div className="text-sm font-semibold">{formatPrice(item.lineTotal)}</div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function ShippingCard({ order }: { order: Order }) {
  const a = order.shippingAddress
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin className="size-4" /> Shipping details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <div className="font-medium">{a.fullName}</div>
        <div className="text-muted-foreground">
          {a.line1}
          {a.line2 && <>, {a.line2}</>}
          <br />
          {a.city}, {a.state} {a.pincode}
          <br />
          {a.country}
        </div>
        <div className="flex items-center gap-1.5 pt-2 text-muted-foreground"><Phone className="size-3.5" /> {a.phone}</div>
        <div className="text-muted-foreground">{a.email}</div>
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
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'truncate font-mono text-xs leading-5' : 'text-right'}>{value}</span>
    </div>
  )
}

export function PaymentCard({ order }: { order: Order }) {
  const p = order.payment
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CreditCard className="size-4" /> Payment details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 text-sm">
        <Row label="Status" value={<PaymentStatusBadge status={p.status} />} />
        <Row label="Method" value={p.method === 'ONLINE' ? 'Online · Razorpay' : 'Cash on delivery'} />
        <Row label="Razorpay order" value={p.razorpayOrderId} mono />
        <Row label="Payment ID" value={p.razorpayPaymentId} mono />
        <Row label="Transaction" value={p.transactionId} mono />
        <Row label="Paid at" value={p.paidAt && formatDateTime(p.paidAt)} />
      </CardContent>
    </Card>
  )
}

export function OrderTotalsCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price details</CardTitle>
      </CardHeader>
      <CardContent>
        <PriceBreakdown
          itemCount={order.items.reduce((n, i) => n + i.quantity, 0)}
          mrpTotal={order.subtotal + order.discountTotal}
          discountTotal={order.discountTotal}
          shippingFee={order.shippingFee}
          total={order.totalAmount}
        />
      </CardContent>
    </Card>
  )
}
