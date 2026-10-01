import { ThemeProvider } from 'next-themes'
import { RouterProvider } from 'react-router-dom'
import { CartSync } from '@/components/common/CartSync'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { THEME_STORAGE_KEY } from '@/lib/theme'
import { router } from './router'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey={THEME_STORAGE_KEY} disableTransitionOnChange>
      <TooltipProvider>
        <CartSync />
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  )
}
