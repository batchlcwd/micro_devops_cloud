import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { inventoryService } from '@/services'
import { useCartStore } from '@/stores/cartStore'
import type { Product } from '@/types'

/** Adds a product to the cart after checking live stock, with toast feedback. */
export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem)
  const navigate = useNavigate()
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function addToCart(product: Product, quantity = 1, knownStock?: number) {
    setPendingId(product.id)
    try {
      const stock = knownStock ?? (await inventoryService.getByProductId(product.id))?.availableQuantity ?? 0
      if (stock <= 0) {
        toast.error('Out of stock', { description: `${product.title} is currently unavailable.` })
        return false
      }
      const inCart = useCartStore.getState().items.find((i) => i.productId === product.id)?.quantity ?? 0
      if (inCart >= stock) {
        toast.warning('Stock limit reached', { description: `Only ${stock} available — all already in your cart.` })
        return false
      }
      addItem(product, quantity, stock)
      toast.success('Added to cart', {
        description: product.title,
        action: { label: 'View cart', onClick: () => navigate('/cart') },
      })
      return true
    } finally {
      setPendingId(null)
    }
  }

  return { addToCart, pendingId }
}
