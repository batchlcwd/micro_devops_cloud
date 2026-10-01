import { Loader2, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAddToCart } from '@/hooks/useAddToCart'
import { averageRating } from '@/lib/pricing'
import type { Product } from '@/types'
import { PriceTag } from './PriceTag'
import { RatingStars } from './RatingStars'

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, pendingId } = useAddToCart()
  const adding = pendingId === product.id
  const { rating, count } = averageRating(product.reviews)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg">
      <Link to={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-muted">
        <ImageWithFallback
          src={product.productImages?.[0]}
          alt={product.title}
          className="size-full transition-transform duration-500 group-hover:scale-105"
        />
        {product.discount > 0 && (
          <Badge className="absolute top-3 left-3 border-0 bg-rose-600 text-white">-{product.discount}%</Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.categories?.[0] && (
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{product.categories[0].title}</div>
        )}
        <Link to={`/products/${product.id}`} className="line-clamp-2 min-h-10 text-sm leading-5 font-medium hover:underline">
          {product.title}
        </Link>
        <RatingStars rating={rating} count={count} />
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <PriceTag price={product.price} discount={product.discount} />
          <Button
            size="icon"
            variant="outline"
            className="shrink-0"
            onClick={() => addToCart(product)}
            disabled={adding}
            aria-label={`Add ${product.title} to cart`}
          >
            {adding ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
