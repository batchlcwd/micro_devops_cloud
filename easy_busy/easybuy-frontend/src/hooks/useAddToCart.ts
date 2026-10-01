import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/http'
import { useCartStore } from '@/stores/cartStore'
import type { Product } from '@/types'

/**
 * Adds a product to the cart with toast feedback. Signed-in carts go to
 * cart-order-service, which rejects the add if stock is insufficient.
 */
export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem)
  const pendingId = useCartStore((s) => s.pendingId)
  const navigate = useNavigate()

  async function addToCart(product: Product, quantity = 1, knownStock?: number | null) {
    if (knownStock !== undefined && knownStock !== null && knownStock <= 0) {
      toast.error('Out of stock', { description: `${product.title} is currently unavailable.` })
      return false
    }
    try {
      await addItem(product, quantity)
      toast.success('Added to cart', {
        description: product.title,
        action: { label: 'View cart', onClick: () => navigate('/cart') },
      })
      return true
    } catch (e) {
      toast.error('Could not add to cart', { description: errorMessage(e) })
      return false
    }
  }

  return { addToCart, pendingId }
}
