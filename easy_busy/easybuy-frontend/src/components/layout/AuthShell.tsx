import { ShieldCheck, Truck, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Logo } from './Logo'

const points = [
  { icon: Truck, text: 'Free delivery on every order' },
  { icon: ShieldCheck, text: 'Secure payments with Razorpay' },
  { icon: Zap, text: 'Track orders in real time' },
]

/** Split-screen frame shared by the sign-in and registration pages. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-primary via-indigo-600 to-violet-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden />
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <Logo className="relative text-white [&>span:first-child]:bg-white/20 [&>span:first-child]:shadow-none" />
        <div className="relative max-w-md space-y-6">
          <h2 className="text-4xl leading-tight font-semibold text-balance">Shop smarter. Get it faster.</h2>
          <p className="text-white/75">Join thousands of happy customers discovering great products at honest prices.</p>
          <ul className="space-y-3">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/60">© EasyBuy. All rights reserved.</p>
      </aside>
      <main className="relative flex flex-col items-center justify-center bg-background px-4 py-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Logo className="mb-8 lg:hidden" />
        {children}
      </main>
    </div>
  )
}
