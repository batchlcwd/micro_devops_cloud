import { RouterProvider } from 'react-router-dom'
import { CartSync } from '@/components/common/CartSync'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from './router'

export default function App() {
  return (
    <TooltipProvider>
      <CartSync />
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  )
}
