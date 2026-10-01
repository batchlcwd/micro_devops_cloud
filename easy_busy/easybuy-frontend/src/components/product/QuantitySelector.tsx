import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max: number
  size?: 'sm' | 'default'
  disabled?: boolean
  className?: string
}

export function QuantitySelector({ value, onChange, min = 1, max, size = 'default', disabled, className }: QuantitySelectorProps) {
  const btnSize = size === 'sm' ? 'icon-sm' : 'icon'
  return (
    <div className={cn('inline-flex items-center rounded-lg border', className)}>
      <Button
        type="button"
        variant="ghost"
        size={btnSize}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus />
      </Button>
      <span className={cn('text-center font-medium tabular-nums', size === 'sm' ? 'w-8 text-sm' : 'w-10')} aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size={btnSize}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus />
      </Button>
    </div>
  )
}
