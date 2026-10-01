import { Check } from 'lucide-react'
import { orderStatusMeta } from '@/components/common/StatusBadges'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

const steps: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

/** Horizontal progress tracker (PENDING → DELIVERED), or a cancelled notice. */
export function OrderProgress({ order }: { order: Order }) {
  if (order.status === 'CANCELLED') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <span className="font-medium text-destructive">This order was cancelled</span>
        {order.cancelledAt && <span className="text-muted-foreground"> on {formatDateTime(order.cancelledAt)}</span>}
        {order.payment.status === 'REFUNDED' && (
          <p className="mt-1 text-muted-foreground">Your refund has been initiated and will reflect in 5–7 business days.</p>
        )}
      </div>
    )
  }
  const current = steps.indexOf(order.status)
  return (
    <ol className="grid grid-cols-4">
      {steps.map((s, i) => {
        const done = i <= current
        const event = order.statusHistory.find((h) => h.status === s)
        const Icon = orderStatusMeta[s].icon
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
            <span className={cn('mt-2 text-xs font-medium sm:text-sm', !done && 'text-muted-foreground')}>{orderStatusMeta[s].label}</span>
            {event && <span className="hidden text-[11px] text-muted-foreground sm:block">{formatDateTime(event.at)}</span>}
          </li>
        )
      })}
    </ol>
  )
}

/** Vertical activity log of every status change. */
export function OrderHistory({ order }: { order: Order }) {
  return (
    <ol className="space-y-4">
      {[...order.statusHistory].reverse().map((h, i) => (
        <li key={`${h.status}-${h.at}`} className="flex gap-3">
          <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', i === 0 ? 'bg-primary' : 'bg-border')} />
          <div>
            <div className="text-sm font-medium">{orderStatusMeta[h.status].label}</div>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(h.at)}
              {h.note && ` · ${h.note}`}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
