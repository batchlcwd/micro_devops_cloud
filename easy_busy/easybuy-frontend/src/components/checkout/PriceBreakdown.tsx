import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/format'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/pricing'

interface PriceBreakdownProps {
  itemCount?: number
  mrpTotal: number
  discountTotal: number
  shippingFee: number
  total: number
  showFreeShippingHint?: boolean
  subtotal?: number
}

export function PriceBreakdown({ itemCount, mrpTotal, discountTotal, shippingFee, total, showFreeShippingHint, subtotal }: PriceBreakdownProps) {
  const remaining = subtotal !== undefined ? FREE_SHIPPING_THRESHOLD - subtotal : 0
  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Price{itemCount !== undefined && ` (${itemCount} item${itemCount === 1 ? '' : 's'})`}</span>
        <span>{formatPrice(mrpTotal)}</span>
      </div>
      {discountTotal > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Discount</span>
          <span className="text-emerald-600 dark:text-emerald-400">−{formatPrice(discountTotal)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted-foreground">Delivery</span>
        <span>{shippingFee === 0 ? <span className="text-emerald-600 dark:text-emerald-400">Free</span> : formatPrice(shippingFee)}</span>
      </div>
      {showFreeShippingHint && remaining > 0 && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Add {formatPrice(remaining)} more for free delivery.
        </p>
      )}
      <Separator />
      <div className="flex justify-between text-base font-semibold">
        <span>Total amount</span>
        <span>{formatPrice(total)}</span>
      </div>
      {discountTotal > 0 && (
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          You save {formatPrice(discountTotal)} on this order
        </p>
      )}
    </div>
  )
}
