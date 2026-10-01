import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { effectivePrice } from '@/lib/pricing'
import { computeTotals } from '@/lib/pricing'
import { cartService, productService } from '@/services'
import type { CartItem, CartResponse, Product } from '@/types'

/** Per-line cap used by the quantity selectors; the backend enforces real stock. */
export const MAX_QTY_PER_ITEM = 10

type Mode = 'guest' | 'server'

interface CartState {
  /** 'guest' = localStorage cart; 'server' = cart-order-service cart of `userId` */
  mode: Mode
  userId: string | null
  items: CartItem[]
  loading: boolean
  /** productId currently being changed, for per-row spinners */
  pendingId: string | null

  addItem: (product: Product, quantity: number) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clear: () => Promise<void>

  /** Switch to the user's server cart, first pushing any guest items into it. */
  attachUser: (userId: string) => Promise<void>
  /** Back to an empty guest cart (logout). */
  detachUser: () => void
  /** Re-read the server cart (e.g. after checkout empties it). */
  refresh: () => Promise<void>
}

function fromResponse(res: CartResponse): CartItem[] {
  return res.items.map((i) => {
    const product = productService.cached(i.productId)
    return {
      productId: i.productId,
      title: i.productTitle,
      image: product?.productImages?.[0],
      unitPrice: Number(i.unitPrice),
      discount: i.discountPercent ?? 0,
      quantity: i.quantity,
    }
  })
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      /** Apply a CartResponse, then fill in product images the response doesn't carry. */
      const apply = (res: CartResponse) => {
        set({ items: fromResponse(res) })
        const missing = res.items.filter((i) => !productService.cached(i.productId)).map((i) => i.productId)
        if (missing.length) {
          productService.getMany(missing).then(() => {
            if (get().mode === 'server') set({ items: fromResponse(res) })
          })
        }
      }

      const run = async (productId: string | null, fn: () => Promise<void>) => {
        set({ pendingId: productId })
        try {
          await fn()
        } finally {
          set({ pendingId: null })
        }
      }

      return {
        mode: 'guest',
        userId: null,
        items: [],
        loading: false,
        pendingId: null,

        addItem: (product, quantity) =>
          run(product.id, async () => {
            const { mode, userId } = get()
            if (mode === 'server' && userId) {
              apply(await cartService.addItem(userId, product.id, quantity))
              return
            }
            set((s) => {
              const existing = s.items.find((i) => i.productId === product.id)
              if (existing) {
                return {
                  items: s.items.map((i) =>
                    i.productId === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QTY_PER_ITEM) } : i,
                  ),
                }
              }
              const item: CartItem = {
                productId: product.id,
                title: product.title,
                image: product.productImages?.[0],
                unitPrice: effectivePrice(product.price, product.discount),
                discount: product.discount ?? 0,
                quantity: Math.min(quantity, MAX_QTY_PER_ITEM),
              }
              return { items: [...s.items, item] }
            })
          }),

        updateQuantity: (productId, quantity) =>
          run(productId, async () => {
            const qty = Math.max(1, Math.min(quantity, MAX_QTY_PER_ITEM))
            const { mode, userId } = get()
            if (mode === 'server' && userId) {
              apply(await cartService.updateItem(userId, productId, qty))
              return
            }
            set((s) => ({ items: s.items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)) }))
          }),

        removeItem: (productId) =>
          run(productId, async () => {
            const { mode, userId } = get()
            if (mode === 'server' && userId) {
              apply(await cartService.removeItem(userId, productId))
              return
            }
            set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }))
          }),

        clear: () =>
          run(null, async () => {
            const { mode, userId } = get()
            if (mode === 'server' && userId) await cartService.clear(userId)
            set({ items: [] })
          }),

        attachUser: async (userId) => {
          const { mode, userId: current, items } = get()
          if (mode === 'server' && current === userId) return get().refresh()
          set({ loading: true })
          try {
            const guestItems = mode === 'guest' ? items : []
            set({ mode: 'server', userId, items: [] })
            let res = await cartService.get(userId)
            for (const item of guestItems) {
              try {
                res = await cartService.addItem(userId, item.productId, item.quantity)
              } catch {
                // product removed or out of stock — skip it rather than failing the whole merge
              }
            }
            apply(res)
          } finally {
            set({ loading: false })
          }
        },

        detachUser: () => set({ mode: 'guest', userId: null, items: [] }),

        refresh: async () => {
          const { mode, userId } = get()
          if (mode !== 'server' || !userId) return
          set({ loading: true })
          try {
            apply(await cartService.get(userId))
          } finally {
            set({ loading: false })
          }
        },
      }
    },
    {
      name: 'easybuy-cart',
      storage: createJSONStorage(() => localStorage),
      // Only the guest cart lives in localStorage; the server cart is re-fetched.
      partialize: (s) => ({ items: s.mode === 'guest' ? s.items : [] }),
    },
  ),
)

export const useCartCount = () => useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))

export const selectCartTotals = (s: CartState) => computeTotals(s.items)
