import { CheckCircle2, CircleDashed, PackageCheck, PackageOpen, Truck, XCircle, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { orderStatusLabel } from '@/lib/orderStatus'
import { cn } from '@/lib/utils'
import type { OrderStatus, PaymentStatus, StockStatus } from '@/types'

const tone = {
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
}

export const orderStatusIcon: Record<OrderStatus, LucideIcon> = {
  CONFIRMED: CheckCircle2,
  IN_PROGRESS: PackageOpen,
  DISPATCHED: Truck,
  OUT_OF_DELIVERY: Truck,
  DELIVERED: PackageCheck,
  CANCELLED: XCircle,
}

const orderTone: Record<OrderStatus, string> = {
  CONFIRMED: tone.blue,
  IN_PROGRESS: tone.indigo,
  DISPATCHED: tone.violet,
  OUT_OF_DELIVERY: tone.amber,
  DELIVERED: tone.green,
  CANCELLED: tone.red,
}

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const Icon = orderStatusIcon[status] ?? CircleDashed
  return (
    <Badge className={cn('border-0', orderTone[status], className)}>
      <Icon data-icon="inline-start" />
      {orderStatusLabel(status)}
    </Badge>
  )
}

const paymentTone: Record<PaymentStatus, string> = {
  PENDING: tone.amber,
  PAID: tone.green,
  FAILED: tone.red,
}

const paymentLabel: Record<PaymentStatus, string> = { PENDING: 'Pending', PAID: 'Paid', FAILED: 'Failed' }

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <Badge className={cn('border-0', paymentTone[status], className)}>
      {status === 'PENDING' && <CircleDashed data-icon="inline-start" />}
      {paymentLabel[status] ?? status}
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
