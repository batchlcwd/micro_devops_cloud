import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { PriceBreakdown } from '@/components/checkout/PriceBreakdown'
import { EmptyState } from '@/components/common/EmptyState'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { PageHeader } from '@/components/common/PageHeader'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatPrice } from '@/lib/format'
import { errorMessage } from '@/lib/http'
import { mrpFromUnit } from '@/lib/pricing'
import { useAuthStore } from '@/stores/authStore'
import { MAX_QTY_PER_ITEM, selectCartTotals, useCartStore } from '@/stores/cartStore'

export function CartPage() {
  useDocumentTitle('Cart')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { items, loading, pendingId, updateQuantity, removeItem, clear } = useCartStore()
  const totals = useCartStore(useShallow(selectCartTotals))

  const attempt = async (fn: () => Promise<void>, success?: string, description?: string) => {
    try {
      await fn()
      if (success) toast(success, { description })
    } catch (e) {
      toast.error('Could not update cart', { description: errorMessage(e) })
    }
  }

  if (user?.role === 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Admins don't have a cart"
          description="Sign in with a customer account to shop."
          action={<Button asChild><Link to="/admin">Go to dashboard</Link></Button>}
        />
      </div>
    )
  }

  if (loading && items.length === 0) {
    return (
      <div className="container mx-auto space-y-4 px-4 py-8">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )
  }

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
                <AlertDialogAction variant="destructive" onClick={() => attempt(clear, 'Cart cleared')}>
                  Clear cart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="divide-y rounded-xl border bg-card">
          {items.map((item) => {
            const busy = pendingId === item.productId
            return (
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
                      disabled={busy}
                      onClick={() => attempt(() => removeItem(item.productId), 'Removed from cart', item.title)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-semibold">{formatPrice(item.unitPrice)}</span>
                    {item.discount > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(mrpFromUnit(item.unitPrice, item.discount))}</span>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{item.discount}% off</span>
                      </>
                    )}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <QuantitySelector
                        size="sm"
                        value={item.quantity}
                        max={MAX_QTY_PER_ITEM}
                        disabled={busy}
                        onChange={(q) => attempt(() => updateQuantity(item.productId, q))}
                      />
                      {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                    </div>
                    <div className="text-sm font-semibold">{formatPrice(item.unitPrice * item.quantity)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-4">
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <PriceBreakdown {...totals} />
              <Button size="lg" className="h-11 w-full" onClick={() => navigate('/checkout')} disabled={!!pendingId}>
                {user ? 'Proceed to checkout' : 'Sign in to checkout'} <ArrowRight data-icon="inline-end" />
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
