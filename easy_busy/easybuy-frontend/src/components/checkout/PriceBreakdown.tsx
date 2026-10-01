import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/format'

interface PriceBreakdownProps {
  itemCount?: number
  mrpTotal: number
  discountTotal: number
  total: number
}

/** Mirrors cart-order-service totals: Σ discounted line totals, with no delivery fee. */
export function PriceBreakdown({ itemCount, mrpTotal, discountTotal, total }: PriceBreakdownProps) {
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
        <span className="text-emerald-600 dark:text-emerald-400">Free</span>
      </div>
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
