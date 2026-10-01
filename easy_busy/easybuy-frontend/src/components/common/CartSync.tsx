import { useEffect } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/http'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'

/** Keeps the cart bound to the signed-in user: merges the guest cart on login, clears it on logout. */
export function CartSync() {
  const userId = useAuthStore((s) => s.user?.id)
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN')

  useEffect(() => {
    const cart = useCartStore.getState()
    if (!userId) {
      if (cart.mode === 'server') cart.detachUser()
      return
    }
    // Admins manage the store; they don't get a shopping cart
    if (isAdmin) return
    cart.attachUser(userId).catch((e) => toast.error('Could not load your cart', { description: errorMessage(e) }))
  }, [userId, isAdmin])

  return null
}
