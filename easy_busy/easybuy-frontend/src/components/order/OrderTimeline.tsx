import { Check } from 'lucide-react'
import { orderStatusIcon } from '@/components/common/StatusBadges'
import { formatDateTime } from '@/lib/format'
import { FULFILMENT_FLOW, orderStatusLabel } from '@/lib/orderStatus'
import { cn } from '@/lib/utils'
import type { Order } from '@/types'

/** Horizontal tracker for CONFIRMED → DELIVERED, or a cancelled notice. */
export function OrderProgress({ order }: { order: Order }) {
  if (order.status === 'CANCELLED') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <span className="font-medium text-destructive">This order was cancelled</span>
        {order.cancelledAt && <span className="text-muted-foreground"> on {formatDateTime(order.cancelledAt)}</span>}
        {order.paymentStatus === 'PAID' && (
          <p className="mt-1 text-muted-foreground">If you were charged, the amount will be refunded to your original payment method.</p>
        )}
      </div>
    )
  }
  const current = FULFILMENT_FLOW.indexOf(order.status)
  return (
    <ol className="grid grid-cols-5">
      {FULFILMENT_FLOW.map((s, i) => {
        const done = i <= current
        const Icon = orderStatusIcon[s]
        return (
          <li key={s} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <span className={cn('absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2', i <= current ? 'bg-primary' : 'bg-border')} />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 items-center justify-center rounded-full border-2 bg-background',
                done ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {done && i < current ? <Check className="size-4" /> : <Icon className="size-4" />}
            </span>
            <span className={cn('mt-2 text-[11px] font-medium sm:text-sm', !done && 'text-muted-foreground')}>{orderStatusLabel(s)}</span>
          </li>
        )
      })}
    </ol>
  )
}
