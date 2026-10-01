import { orderStatusIcon } from '@/components/common/StatusBadges'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { allowedTransitions, orderStatusLabel } from '@/lib/orderStatus'
import { ORDER_STATUSES, type OrderStatus } from '@/types'

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
          const Icon = orderStatusIcon[s]
          return (
            <SelectItem key={s} value={s} disabled={s !== value && !allowed.includes(s)}>
              <Icon /> {orderStatusLabel(s)}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
