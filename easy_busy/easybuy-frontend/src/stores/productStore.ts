import { create } from 'zustand'
import { categoryService, inventoryService, productService } from '@/services'
import type { Category, Product, ProductInput } from '@/types'

interface ProductState {
  categories: Category[]
  categoriesLoaded: boolean
  /** Full catalogue (including hidden products) for admin screens */
  adminProducts: Product[]
  adminLoading: boolean
  fetchCategories: (force?: boolean) => Promise<void>
  createCategory: (title: string) => Promise<Category>
  fetchAdminProducts: () => Promise<void>
  /** Creates the product, then its inventory record (inventory-service has no product event listener). */
  createProduct: (input: ProductInput, stock: { quantity: number; warehouse: string }) => Promise<Product>
  updateProduct: (id: string, input: ProductInput) => Promise<Product>
  deleteProduct: (id: string) => Promise<void>
}

/**
 * Shared catalogue state. Storefront listing/detail pages call
 * `productService` through hooks since their results are query-specific.
 */
export const useProductStore = create<ProductState>((set, get) => ({
  categories: [],
  categoriesLoaded: false,
  adminProducts: [],
  adminLoading: false,

  fetchCategories: async (force) => {
    if (get().categoriesLoaded && !force) return
    try {
      set({ categories: await categoryService.getAll(), categoriesLoaded: true })
    } catch {
      set({ categoriesLoaded: false })
    }
  },

  createCategory: async (title) => {
    const category = await categoryService.create(title)
    set((s) => ({ categories: [...s.categories, category] }))
    return category
  },

  fetchAdminProducts: async () => {
    set({ adminLoading: true })
    try {
      set({ adminProducts: await productService.getAll() })
    } finally {
      set({ adminLoading: false })
    }
  },

  createProduct: async (input, stock) => {
    const product = await productService.create(input)
    set((s) => ({ adminProducts: [product, ...s.adminProducts] }))
    await inventoryService.create({
      productId: product.id,
      sku: `EB-${(product.categories[0]?.title ?? 'GEN').slice(0, 3).toUpperCase()}-${product.id.slice(0, 8).toUpperCase()}`,
      productName: product.title,
      warehouseLocation: stock.warehouse,
      availableQuantity: stock.quantity,
      reorderLevel: 10,
      active: product.live,
    })
    return product
  },

  updateProduct: async (id, input) => {
    const product = await productService.update(id, input)
    set((s) => ({ adminProducts: s.adminProducts.map((p) => (p.id === id ? product : p)) }))
    return product
  },

  deleteProduct: async (id) => {
    await productService.remove(id)
    set((s) => ({ adminProducts: s.adminProducts.filter((p) => p.id !== id) }))
  },
}))
