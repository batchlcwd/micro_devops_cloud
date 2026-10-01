import { ArrowLeft, ArrowRight, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { PriceBreakdown } from '@/components/checkout/PriceBreakdown'
import { EmptyState } from '@/components/common/EmptyState'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { PageHeader } from '@/components/common/PageHeader'
import { PriceTag } from '@/components/product/PriceTag'
import { QuantitySelector } from '@/components/product/QuantitySelector'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatPrice } from '@/lib/format'
import { effectivePrice } from '@/lib/pricing'
import { selectCartTotals, useCartStore } from '@/stores/cartStore'

export function CartPage() {
  useDocumentTitle('Cart')
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, clear } = useCartStore()
  const totals = useCartStore(useShallow(selectCartTotals))

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Explore our products and find something you love."
          action={<Button asChild><Link to="/products">Start shopping</Link></Button>}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Shopping cart"
        description={`${totals.itemCount} item${totals.itemCount === 1 ? '' : 's'} in your cart`}
        actions={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Trash2 data-icon="inline-start" /> Clear cart
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
                <AlertDialogDescription>All {items.length} products will be removed from your cart.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep items</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    clear()
                    toast.success('Cart cleared')
                  }}
                >
                  Clear cart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="divide-y rounded-xl border bg-card">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 p-4 sm:p-5">
              <Link to={`/products/${item.productId}`} className="shrink-0">
                <ImageWithFallback src={item.image} alt={item.title} className="size-24 rounded-lg sm:size-28" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/products/${item.productId}`} className="line-clamp-2 font-medium hover:underline">
                    {item.title}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${item.title}`}
                    onClick={() => {
                      removeItem(item.productId)
                      toast('Removed from cart', { description: item.title })
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <PriceTag price={item.price} discount={item.discount} />
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <QuantitySelector
                      size="sm"
                      value={item.quantity}
                      max={item.maxQuantity}
                      onChange={(q) => updateQuantity(item.productId, q)}
                    />
                    {item.quantity >= item.maxQuantity && (
                      <span className="text-xs text-amber-700 dark:text-amber-400">Max available</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold">
                    {formatPrice(effectivePrice(item.price, item.discount) * item.quantity)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <PriceBreakdown {...totals} showFreeShippingHint />
              <Button size="lg" className="h-11 w-full" onClick={() => navigate('/checkout')}>
                Proceed to checkout <ArrowRight data-icon="inline-end" />
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/products">
                  <ArrowLeft data-icon="inline-start" /> Continue shopping
                </Link>
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Safe and secure payments
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
