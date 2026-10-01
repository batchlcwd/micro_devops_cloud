import { delay } from '@/lib/http'
import { effectivePrice } from '@/lib/pricing'
import type { PagedResponse, Product, ProductInput, ProductQuery } from '@/types'
import { clone, db, persist } from './mock/db'

/**
 * Product API. Each method notes the products-service endpoint it maps to;
 * replace the mock body with the `http` call when wiring the backend.
 */

function sortProducts(list: Product[], sort: ProductQuery['sort']) {
  const price = (p: Product) => effectivePrice(p.price, p.discount)
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => price(a) - price(b))
    case 'price-desc':
      return list.sort((a, b) => price(b) - price(a))
    case 'newest':
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'rating':
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    default:
      return list.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))
  }
}

export const productService = {
  /** REST: GET /api/products/filter?search=&categoryId=&minPrice=&maxPrice=&sort=&page=&size= */
  async getProducts(query: ProductQuery = {}): Promise<PagedResponse<Product>> {
    await delay()
    const { search, categoryId, minPrice, maxPrice, sort = 'popularity', page = 0, size = 12, includeHidden } = query
    const q = search?.trim().toLowerCase()
    const filtered = db.products.filter((p) => {
      if (!includeHidden && !p.live) return false
      if (q && !`${p.title} ${p.brand ?? ''} ${p.shortDesc}`.toLowerCase().includes(q)) return false
      if (categoryId && !p.categories.some((c) => c.id === categoryId)) return false
      const price = effectivePrice(p.price, p.discount)
      if (minPrice !== undefined && price < minPrice) return false
      if (maxPrice !== undefined && price > maxPrice) return false
      return true
    })
    sortProducts(filtered, sort)
    const totalPages = Math.max(1, Math.ceil(filtered.length / size))
    const content = filtered.slice(page * size, page * size + size)
    return {
      content: clone(content),
      pageNumber: page,
      pageSize: size,
      totalElements: filtered.length,
      totalPages,
      numberOfElements: content.length,
      first: page === 0,
      last: page >= totalPages - 1,
    }
  },

  /** REST: GET /api/products (admin view, all products) */
  async getAll(): Promise<Product[]> {
    await delay()
    return clone(db.products)
  },

  /** REST: GET /api/products/{productId} */
  async getById(id: string): Promise<Product | null> {
    await delay(300)
    const p = db.products.find((x) => x.id === id)
    return p ? clone(p) : null
  },

  async getFeatured(limit = 8): Promise<Product[]> {
    await delay()
    return clone(db.products.filter((p) => p.live && p.featured).slice(0, limit))
  },

  async getNewArrivals(limit = 8): Promise<Product[]> {
    await delay()
    return clone(sortProducts(db.products.filter((p) => p.live), 'newest').slice(0, limit))
  },

  async getPopular(limit = 8): Promise<Product[]> {
    await delay()
    return clone(sortProducts(db.products.filter((p) => p.live), 'popularity').slice(0, limit))
  },

  /** REST: GET /api/products/category/{categoryId} */
  async getRelated(product: Product, limit = 4): Promise<Product[]> {
    await delay()
    const catIds = product.categories.map((c) => c.id)
    return clone(
      db.products
        .filter((p) => p.live && p.id !== product.id && p.categories.some((c) => catIds.includes(c.id)))
        .slice(0, limit),
    )
  },

  /** REST: POST /api/products */
  async create(input: ProductInput): Promise<Product> {
    await delay()
    const now = new Date().toISOString()
    const product: Product = { ...input, id: `p-${crypto.randomUUID().slice(0, 8)}`, reviews: [], createdAt: now, updatedAt: now }
    db.products.unshift(product)
    // inventory-service would create a stock record via an event; mirror that here
    db.inventory.unshift({
      id: Math.max(0, ...db.inventory.map((i) => i.id)) + 1,
      productId: product.id,
      sku: `EB-${(product.categories[0]?.title ?? 'GEN').slice(0, 3).toUpperCase()}-${String(db.inventory.length + 1).padStart(4, '0')}`,
      productName: product.title,
      warehouseLocation: 'BLR-WH-01',
      availableQuantity: 0,
      reservedQuantity: 0,
      reorderLevel: 10,
      active: product.live,
      updatedAt: now,
    })
    persist()
    return clone(product)
  },

  /** REST: PUT /api/products/{productId} */
  async update(id: string, input: ProductInput): Promise<Product> {
    await delay()
    const idx = db.products.findIndex((p) => p.id === id)
    if (idx < 0) throw new Error('Product not found')
    db.products[idx] = { ...db.products[idx], ...input, updatedAt: new Date().toISOString() }
    const inv = db.inventory.find((i) => i.productId === id)
    if (inv) {
      inv.productName = input.title
      inv.active = input.live
    }
    persist()
    return clone(db.products[idx])
  },

  /** REST: DELETE /api/products/{productId} */
  async remove(id: string): Promise<void> {
    await delay()
    db.products = db.products.filter((p) => p.id !== id)
    db.inventory = db.inventory.filter((i) => i.productId !== id)
    persist()
  },
}
