import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from '@/components/common/RequireAuth'
import { AdminLayout } from '@/layouts/AdminLayout'
import { StoreLayout } from '@/layouts/StoreLayout'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { CartPage } from '@/pages/store/CartPage'
import { CheckoutPage } from '@/pages/store/CheckoutPage'
import { HomePage } from '@/pages/store/HomePage'
import { OrderDetailsPage } from '@/pages/store/OrderDetailsPage'
import { OrdersPage } from '@/pages/store/OrdersPage'
import { ProductDetailsPage } from '@/pages/store/ProductDetailsPage'
import { ProductListPage } from '@/pages/store/ProductListPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <StoreLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:id', element: <ProductDetailsPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'orders', element: <RequireAuth><OrdersPage /></RequireAuth> },
      { path: 'orders/:id', element: <RequireAuth><OrderDetailsPage /></RequireAuth> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAuth role="ADMIN">
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      // Admin screens are code-split so shoppers never download them
      { index: true, lazy: () => import('@/pages/admin/DashboardPage').then((m) => ({ Component: m.DashboardPage })) },
      { path: 'products', lazy: () => import('@/pages/admin/AdminProductsPage').then((m) => ({ Component: m.AdminProductsPage })) },
      { path: 'inventory', lazy: () => import('@/pages/admin/AdminInventoryPage').then((m) => ({ Component: m.AdminInventoryPage })) },
      { path: 'orders', lazy: () => import('@/pages/admin/AdminOrdersPage').then((m) => ({ Component: m.AdminOrdersPage })) },
      { path: 'orders/:id', lazy: () => import('@/pages/admin/AdminOrderDetailsPage').then((m) => ({ Component: m.AdminOrderDetailsPage })) },
    ],
  },
])
