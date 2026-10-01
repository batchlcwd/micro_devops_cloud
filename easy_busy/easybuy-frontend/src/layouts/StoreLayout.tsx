import { useEffect } from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { MockRazorpayCheckout } from '@/components/checkout/MockRazorpayCheckout'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { useProductStore } from '@/stores/productStore'

export function StoreLayout() {
  const fetchCategories = useProductStore((s) => s.fetchCategories)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MockRazorpayCheckout />
      <ScrollRestoration />
    </div>
  )
}
