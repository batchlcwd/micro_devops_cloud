import { ArrowRight, BadgePercent, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ErrorState } from '@/components/common/ErrorState'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAsync } from '@/hooks/useAsync'
import { categoryCover, heroImage } from '@/data/staticData'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { productService } from '@/services'
import { useProductStore } from '@/stores/productStore'

function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="container mx-auto px-4 py-10 sm:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function HomePage() {
  useDocumentTitle()
  const categories = useProductStore((s) => s.categories)
  const categoriesLoaded = useProductStore((s) => s.categoriesLoaded)
  const deals = useAsync(() => productService.getDeals(8), [])
  const newArrivals = useAsync(() => productService.getNewArrivals(8), [])
  const topRated = useAsync(() => productService.getTopRated(8), [])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-linear-to-br from-muted/60 via-background to-background">
        <div className="container mx-auto grid items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div className="space-y-6">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles data-icon="inline-start" /> Great deals, every day
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Everything you love, delivered fast.
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Discover great products across every category — with free delivery on every order.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="h-11 px-5" asChild>
                <Link to="/products">
                  Shop now <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-11 px-5" asChild>
                <Link to="/products?sort=newest">New arrivals</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Truck className="size-4" /> Express delivery</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-4" /> Secure checkout</span>
              <span className="flex items-center gap-1.5"><BadgePercent className="size-4" /> Best prices</span>
            </div>
          </div>
          <div className="relative">
            <ImageWithFallback src={heroImage} alt="Shopping at EasyBuy" className="aspect-4/3 w-full rounded-2xl shadow-xl" />
            <div className="absolute -bottom-5 left-5 hidden rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:block">
              <div className="text-xs text-muted-foreground">Delivery</div>
              <div className="text-lg font-semibold">Free on every order</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <Section title="Shop by category" subtitle="Find exactly what you're looking for">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {!categoriesLoaded
            ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-4/5 rounded-xl" />)
            : categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/products?category=${c.id}`}
                  className="group relative aspect-4/5 overflow-hidden rounded-xl"
                >
                  <ImageWithFallback
                    src={categoryCover(c.title)}
                    alt={c.title}
                    className="size-full transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <div className="font-semibold">{c.title}</div>
                  </div>
                </Link>
              ))}
        </div>
      </Section>

      {/* Deals */}
      <Section
        title="Top deals"
        subtitle="The biggest discounts right now"
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/products">View all <ArrowRight data-icon="inline-end" /></Link>
          </Button>
        }
      >
        {deals.error ? (
          <ErrorState message={deals.error.message} onRetry={deals.reload} />
        ) : !deals.loading && deals.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No discounted products right now.</p>
        ) : (
          <ProductGrid products={deals.data} loading={deals.loading} />
        )}
      </Section>

      {/* Promo banner */}
      <section className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-12">
          <div className="relative z-10 max-w-lg space-y-3">
            <Badge className="border-0 bg-rose-600 text-white">Fast & safe</Badge>
            <h3 className="text-2xl font-semibold sm:text-3xl">Secure checkout with Razorpay</h3>
            <p className="text-primary-foreground/70">Pay with UPI, cards or net banking — or choose cash on delivery.</p>
            <Button variant="secondary" asChild>
              <Link to="/products?sort=discount">Shop the deals</Link>
            </Button>
          </div>
          <div className="absolute -top-16 -right-16 size-64 rounded-full bg-primary-foreground/5" />
          <div className="absolute -right-4 -bottom-24 size-72 rounded-full bg-primary-foreground/5" />
        </div>
      </section>

      {/* New arrivals / popular */}
      <Section title="Trending now" subtitle="Fresh drops and customer favourites">
        <Tabs defaultValue="new">
          <TabsList className="mb-6">
            <TabsTrigger value="new">New arrivals</TabsTrigger>
            <TabsTrigger value="rated">Top rated</TabsTrigger>
          </TabsList>
          <TabsContent value="new">
            <ProductGrid products={newArrivals.data} loading={newArrivals.loading} />
          </TabsContent>
          <TabsContent value="rated">
            <ProductGrid products={topRated.data} loading={topRated.loading} />
          </TabsContent>
        </Tabs>
      </Section>
    </>
  )
}
