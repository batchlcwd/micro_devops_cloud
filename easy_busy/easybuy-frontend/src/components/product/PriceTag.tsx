import { formatPrice } from '@/lib/format'
import { effectivePrice } from '@/lib/pricing'
import { cn } from '@/lib/utils'

interface PriceTagProps {
  price: number
  discount?: number
  size?: 'sm' | 'lg'
  className?: string
}

export function PriceTag({ price, discount = 0, size = 'sm', className }: PriceTagProps) {
  const final = effectivePrice(price, discount)
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-semibold tracking-tight', size === 'lg' ? 'text-3xl' : 'text-base')}>{formatPrice(final)}</span>
      {discount > 0 && (
        <>
          <span className={cn('text-muted-foreground line-through', size === 'lg' ? 'text-base' : 'text-xs')}>
            {formatPrice(price)}
          </span>
          <span className={cn('font-medium text-emerald-600 dark:text-emerald-400', size === 'lg' ? 'text-base' : 'text-xs')}>
            {discount}% off
          </span>
        </>
      )}
    </div>
  )
}
