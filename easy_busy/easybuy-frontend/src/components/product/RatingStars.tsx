import { Star } from 'lucide-react'
import { formatCompact } from '@/lib/format'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating?: number
  count?: number
  showStars?: boolean
  className?: string
}

export function RatingStars({ rating = 0, count, showStars = false, className }: RatingStarsProps) {
  if (!rating) return <span className={cn('text-xs text-muted-foreground', className)}>No reviews yet</span>
  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      {showStars ? (
        <div className="flex" aria-label={`${rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn('size-4', i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')}
            />
          ))}
        </div>
      ) : (
        <span className="inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 font-medium text-white">
          {rating.toFixed(1)}
          <Star className="size-3 fill-current" />
        </span>
      )}
      {count !== undefined && <span className="text-muted-foreground">({formatCompact(count)})</span>}
    </div>
  )
}
