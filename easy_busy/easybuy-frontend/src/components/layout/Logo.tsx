import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({ to = '/', className, suffix }: { to?: string; className?: string; suffix?: string }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-violet-500 text-primary-foreground shadow-sm shadow-primary/30">
        <ShoppingBag className="size-4" />
      </span>
      <span className="text-lg">
        EasyBuy{suffix && <span className="ml-1.5 text-xs font-medium text-muted-foreground">{suffix}</span>}
      </span>
    </Link>
  )
}
