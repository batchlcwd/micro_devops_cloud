import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { computeTotals } from '@/lib/pricing'
import type { CartItem, Product } from '@/types'

interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity: number, maxQuantity: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

/**
 * Cart persisted to localStorage. When wiring the backend, mirror these actions
 * to cart-order-service (`/api/carts/{userId}/items`) for logged-in users.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity, maxQuantity) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, maxQuantity, quantity: Math.min(i.quantity + quantity, maxQuantity) }
                  : i,
              ),
            }
          }
          const item: CartItem = {
            productId: product.id,
            title: product.title,
            image: product.productImages[0] ?? '',
            price: product.price,
            discount: product.discount,
            quantity: Math.min(quantity, maxQuantity),
            maxQuantity,
          }
          return { items: [...state.items, item] }
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity)) } : i,
          ),
        })),
      removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'easybuy-cart', storage: createJSONStorage(() => localStorage) },
  ),
)

export const useCartCount = () => useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))

export const selectCartTotals = (s: CartState) => computeTotals(s.items)
