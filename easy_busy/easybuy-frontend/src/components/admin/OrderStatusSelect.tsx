import { orderStatusMeta } from '@/components/common/StatusBadges'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ORDER_STATUSES, type OrderStatus } from '@/types'

/** Which statuses an order may move to from its current one. */
export function allowedTransitions(current: OrderStatus): OrderStatus[] {
  switch (current) {
    case 'PENDING':
      return ['CONFIRMED', 'CANCELLED']
    case 'CONFIRMED':
      return ['SHIPPED', 'CANCELLED']
    case 'SHIPPED':
      return ['DELIVERED']
    default:
      return []
  }
}

interface OrderStatusSelectProps {
  value: OrderStatus
  onChange: (status: OrderStatus) => void
  disabled?: boolean
  className?: string
}

export function OrderStatusSelect({ value, onChange, disabled, className }: OrderStatusSelectProps) {
  const allowed = allowedTransitions(value)
  return (
    <Select value={value} onValueChange={(v) => onChange(v as OrderStatus)} disabled={disabled || allowed.length === 0}>
      <SelectTrigger className={className} size="sm" aria-label="Order status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => {
          const Icon = orderStatusMeta[s].icon
          return (
            <SelectItem key={s} value={s} disabled={s !== value && !allowed.includes(s)}>
              <Icon /> {orderStatusMeta[s].label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
