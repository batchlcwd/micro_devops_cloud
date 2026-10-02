import { CreditCard, Headphones, RotateCcw, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { useProductStore } from '@/stores/productStore'
import { Logo } from './Logo'

const perks = [
  { icon: Truck, title: 'Free delivery', text: 'On every order' },
  { icon: RotateCcw, title: 'Easy returns', text: '7-day hassle-free returns' },
  { icon: CreditCard, title: 'Secure payments', text: 'Powered by Razorpay' },
  { icon: Headphones, title: '24/7 support', text: 'We are here to help' },
]

const year = new Date().getFullYear()

export function Footer() {
  const categories = useProductStore((s) => s.categories)

  return (
    <footer className="mt-24 border-t bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </div>
              <div>
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{text}</div>
              </div>
            </div>
          ))}
        </div>
        <Separator />
        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Quality products, honest prices and fast delivery across India.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to={`/products?category=${c.id}`} className="hover:text-foreground">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/orders" className="hover:text-foreground">My orders</Link></li>
              <li><Link to="/cart" className="hover:text-foreground">Cart</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
              <li><Link to="/admin" className="hover:text-foreground">Admin dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Help</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>support@easybuy.dev</li>
              <li>+91 80 4000 1234</li>
              <li>Mon–Sat, 9am–9pm IST</li>
            </ul>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {year} EasyBuy. All rights reserved.</span>
          <span>Prices are inclusive of all taxes.</span>
        </div>
      </div>
    </footer>
  )
}
