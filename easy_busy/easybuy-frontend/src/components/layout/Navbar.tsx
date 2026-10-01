import { Menu, Search, ShoppingCart } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useCartCount } from '@/stores/cartStore'
import { useProductStore } from '@/stores/productStore'
import { Logo } from './Logo'
import { UserMenu } from './UserMenu'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Shop' },
  { to: '/orders', label: 'Orders' },
]

function SearchForm({ className, onSubmitted }: { className?: string; onSubmitted?: () => void }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [value, setValue] = useState(params.get('q') ?? '')

  useEffect(() => setValue(params.get('q') ?? ''), [params])

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
    onSubmitted?.()
  }

  return (
    <form onSubmit={submit} className={cn('relative', className)} role="search">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products, brands…"
        className="h-9 pl-9"
        aria-label="Search products"
      />
    </form>
  )
}

export function Navbar() {
  const cartCount = useCartCount()
  const categories = useProductStore((s) => s.categories)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle asChild>
                <div>
                  <Logo />
                </div>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              <SearchForm className="mb-3" onSubmitted={() => setMobileOpen(false)} />
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn('rounded-md px-3 py-2 text-sm font-medium hover:bg-muted', isActive && 'bg-muted')
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <Separator className="my-3" />
              <div className="px-3 pb-1 text-xs font-medium text-muted-foreground uppercase">Categories</div>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/products?category=${c.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <Logo />

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <SearchForm className="ml-auto hidden w-full max-w-sm md:block" />

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/cart" aria-label={`Cart, ${cartCount} items`}>
              <ShoppingCart />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
