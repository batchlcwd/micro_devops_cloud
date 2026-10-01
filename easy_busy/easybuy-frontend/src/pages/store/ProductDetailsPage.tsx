import { ChevronRight, Loader2, PackageX, RotateCcw, ShieldCheck, ShoppingBag, ShoppingCart, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { StockBadge } from '@/components/common/StatusBadges'
import { PriceTag } from '@/components/product/PriceTag'
import { ProductGrid } from '@/components/product/ProductGrid'
import { QuantitySelector } from '@/components/product/QuantitySelector'
import { RatingStars } from '@/components/product/RatingStars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAddToCart } from '@/hooks/useAddToCart'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ApiError } from '@/lib/http'
import { averageRating, stockStatus } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { inventoryService, productService } from '@/services'
import { useAuthStore } from '@/stores/authStore'
import { MAX_QTY_PER_ITEM, useCartStore } from '@/stores/cartStore'

function DetailsSkeleton() {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  )
}

export function ProductDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const signedIn = useAuthStore((s) => !!s.user)
  const { addToCart, pendingId } = useAddToCart()
  const inCart = useCartStore((s) => s.items.find((i) => i.productId === id)?.quantity ?? 0)

  const { data: product, loading, error, reload } = useAsync(() => productService.getById(id), [id])
  // Inventory reads need a token, so stock is only known for signed-in shoppers
  const stock = useAsync(() => (signedIn ? inventoryService.getByProductId(id) : Promise.resolve(null)), [id, signedIn])
  const related = useAsync(() => (product ? productService.getRelated(product, 4) : Promise.resolve([])), [product?.id])

  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)
  useEffect(() => {
    setActiveImage(0)
    setQty(1)
  }, [id])

  useDocumentTitle(product?.title)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DetailsSkeleton />
      </div>
    )
  }

  const notFound = (error instanceof ApiError && (error.status === 404 || error.status === 400)) || (product && !product.live)
  if (notFound || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        {error && !notFound ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : (
          <EmptyState
            icon={PackageX}
            title="Product not found"
            description="This product may have been removed or is no longer available."
            action={<Button asChild><Link to="/products">Browse products</Link></Button>}
          />
        )}
      </div>
    )
  }

  const inventory = stock.data
  const stockKnown = signedIn && !stock.loading && inventory !== null && inventory !== undefined
  const available = inventory?.availableQuantity ?? 0
  const status = stockStatus(inventory)
  const outOfStock = stockKnown && available <= 0
  const limit = stockKnown ? Math.min(MAX_QTY_PER_ITEM, available) : MAX_QTY_PER_ITEM
  const maxAddable = Math.max(0, limit - inCart)
  const category = product.categories?.[0]
  const { rating, count } = averageRating(product.reviews)
  const images = product.productImages?.length ? product.productImages : ['']

  async function handleAdd(buyNow = false) {
    const ok = await addToCart(product!, qty, stockKnown ? available : undefined)
    if (ok) setQty(1)
    if (ok && buyNow) navigate('/cart')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-4" />
        <Link to="/products" className="hover:text-foreground">Shop</Link>
        {category && (
          <>
            <ChevronRight className="size-4" />
            <Link to={`/products?category=${category.id}`} className="hover:text-foreground">{category.title}</Link>
          </>
        )}
        <ChevronRight className="hidden size-4 sm:block" />
        <span className="hidden truncate text-foreground sm:block">{product.title}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
            <ImageWithFallback src={images[activeImage]} alt={product.title} className="size-full" />
            {product.discount > 0 && (
              <Badge className="absolute top-4 left-4 border-0 bg-rose-600 text-white">-{product.discount}%</Badge>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'size-20 overflow-hidden rounded-lg border-2 transition-colors',
                    i === activeImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <ImageWithFallback src={src} alt="" className="size-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {category && <div className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{category.title}</div>}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{product.title}</h1>
          <RatingStars rating={rating} count={count} showStars className="mt-3 text-sm" />

          <PriceTag price={product.price} discount={product.discount} size="lg" className="mt-5" />
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

          <div className="mt-4 flex min-h-6 items-center gap-3">
            {!signedIn ? (
              <span className="text-sm text-muted-foreground">
                <Link to={`/login?redirect=/products/${product.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">Sign in</Link> to check availability
              </span>
            ) : stock.loading ? (
              <Skeleton className="h-5 w-40" />
            ) : stockKnown ? (
              <>
                <StockBadge status={status} />
                {status === 'LOW_STOCK' && <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Only {available} left — order soon!</span>}
                {status === 'IN_STOCK' && <span className="text-sm text-muted-foreground">Ships in 1–2 business days</span>}
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Availability information is not available for this item.</span>
            )}
          </div>

          <p className="mt-5 text-muted-foreground">{product.shortDesc}</p>

          <Separator className="my-6" />

          {outOfStock ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              This item is currently out of stock. Check back soon!
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity</span>
                <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, maxAddable)} disabled={maxAddable === 0} />
                {inCart > 0 && <span className="text-xs text-muted-foreground">{inCart} already in cart</span>}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="outline" className="h-11 flex-1" onClick={() => handleAdd()} disabled={!!pendingId || maxAddable === 0}>
                  {pendingId ? <Loader2 className="animate-spin" /> : <ShoppingCart data-icon="inline-start" />}
                  Add to cart
                </Button>
                <Button size="lg" className="h-11 flex-1" onClick={() => handleAdd(true)} disabled={!!pendingId || maxAddable === 0}>
                  <ShoppingBag data-icon="inline-start" /> Buy now
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
            <div className="rounded-lg border p-3"><Truck className="mx-auto mb-1.5 size-5 text-foreground" />Free delivery</div>
            <div className="rounded-lg border p-3"><RotateCcw className="mx-auto mb-1.5 size-5 text-foreground" />7-day returns</div>
            <div className="rounded-lg border p-3"><ShieldCheck className="mx-auto mb-1.5 size-5 text-foreground" />Secure payments</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="description" className="mt-14">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({count})</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="max-w-3xl pt-4 leading-relaxed whitespace-pre-line text-muted-foreground">
          {product.longDesc}
        </TabsContent>
        <TabsContent value="reviews" className="max-w-3xl pt-4">
          {product.reviews?.length ? (
            <div className="divide-y">
              {product.reviews.map((r) => (
                <div key={r.id} className="py-4">
                  <div className="font-medium">{r.title}</div>
                  <RatingStars rating={r.rating} showStars className="mt-1" />
                  <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </TabsContent>
      </Tabs>

      {(related.loading || (related.data && related.data.length > 0)) && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">You may also like</h2>
          <ProductGrid products={related.data} loading={related.loading} skeletonCount={4} />
        </section>
      )}
    </div>
  )
}
