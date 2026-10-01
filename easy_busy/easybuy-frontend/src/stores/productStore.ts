import { create } from 'zustand'
import { categoryService, productService } from '@/services'
import type { Category, Product, ProductInput } from '@/types'

interface ProductState {
  categories: Category[]
  categoriesLoaded: boolean
  /** Full catalogue for admin screens */
  adminProducts: Product[]
  adminLoading: boolean
  fetchCategories: () => Promise<void>
  fetchAdminProducts: () => Promise<void>
  createProduct: (input: ProductInput) => Promise<Product>
  updateProduct: (id: string, input: ProductInput) => Promise<Product>
  deleteProduct: (id: string) => Promise<void>
}

/**
 * Shared catalogue state. Storefront listing/detail pages query
 * `productService` directly through hooks since their results are
 * query-specific; categories and admin CRUD live here.
 */
export const useProductStore = create<ProductState>((set, get) => ({
  categories: [],
  categoriesLoaded: false,
  adminProducts: [],
  adminLoading: false,

  fetchCategories: async () => {
    if (get().categoriesLoaded) return
    const categories = await categoryService.getAll()
    set({ categories, categoriesLoaded: true })
  },

  fetchAdminProducts: async () => {
    set({ adminLoading: true })
    try {
      set({ adminProducts: await productService.getAll() })
    } finally {
      set({ adminLoading: false })
    }
  },

  createProduct: async (input) => {
    const product = await productService.create(input)
    set((s) => ({ adminProducts: [product, ...s.adminProducts] }))
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
