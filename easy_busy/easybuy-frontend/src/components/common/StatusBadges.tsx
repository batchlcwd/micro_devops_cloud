import { CheckCircle2, CircleDashed, Clock, PackageCheck, Truck, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { titleCase } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderStatus, PaymentStatus, StockStatus } from '@/types'

const tone = {
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  gray: 'bg-muted text-muted-foreground',
}

export const orderStatusMeta: Record<OrderStatus, { className: string; icon: typeof Clock; label: string }> = {
  PENDING: { className: tone.amber, icon: Clock, label: 'Pending' },
  CONFIRMED: { className: tone.blue, icon: CheckCircle2, label: 'Confirmed' },
  SHIPPED: { className: tone.violet, icon: Truck, label: 'Shipped' },
  DELIVERED: { className: tone.green, icon: PackageCheck, label: 'Delivered' },
  CANCELLED: { className: tone.red, icon: XCircle, label: 'Cancelled' },
}

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const meta = orderStatusMeta[status]
  const Icon = meta.icon
  return (
    <Badge className={cn('border-0', meta.className, className)}>
      <Icon data-icon="inline-start" />
      {meta.label}
    </Badge>
  )
}

const paymentTone: Record<PaymentStatus, string> = {
  PENDING: tone.amber,
  PAID: tone.green,
  FAILED: tone.red,
  REFUNDED: tone.gray,
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <Badge className={cn('border-0', paymentTone[status], className)}>
      {status === 'PENDING' && <CircleDashed data-icon="inline-start" />}
      {titleCase(status)}
    </Badge>
  )
}

const stockMeta: Record<StockStatus, { className: string; label: string }> = {
  IN_STOCK: { className: tone.green, label: 'In stock' },
  LOW_STOCK: { className: tone.amber, label: 'Low stock' },
  OUT_OF_STOCK: { className: tone.red, label: 'Out of stock' },
}

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const meta = stockMeta[status]
  return <Badge className={cn('border-0', meta.className, className)}>{meta.label}</Badge>
}
