import { cn } from '@/lib/utils'
import type { Product } from '@/types'
import { ProductCard, ProductCardSkeleton } from './ProductCard'

interface ProductGridProps {
  products?: Product[]
  loading?: boolean
  skeletonCount?: number
  className?: string
}

export function ProductGrid({ products, loading, skeletonCount = 8, className }: ProductGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4', className)}>
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <ProductCardSkeleton key={i} />)
        : products?.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
