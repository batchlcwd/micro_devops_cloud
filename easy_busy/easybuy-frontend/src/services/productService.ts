import { api } from '@/lib/http'
import { averageRating, effectivePrice } from '@/lib/pricing'
import type { Category, PagedResponse, Product, ProductInput, ProductQuery } from '@/types'

/**
 * products-service via gateway route /products.
 *
 * The backend offers /filter (category, price, live) and /search (q) as separate
 * endpoints with no sort parameter. To support combined search + filters + sort
 * on the listing page, the catalogue for a category is loaded through /filter
 * (all pages, cached briefly) and refined client-side. When the backend gains
 * combined filtering and sorting, move those params into `getProducts`.
 */

const MAX_PAGE = 100
const CACHE_MS = 30_000

const listCache = new Map<string, { at: number; data: Promise<Product[]> }>()
const productCache = new Map<string, Product>()

function remember(products: Product[]) {
  products.forEach((p) => productCache.set(p.id, p))
  return products
}

/** Load every page of a paged endpoint. Duplicates (from the category LEFT JOIN) are dropped. */
async function fetchAllPages(path: string, query: Record<string, string | number | boolean | undefined>) {
  const seen = new Map<string, Product>()
  let page = 0
  for (;;) {
    const res = await api.products.get<PagedResponse<Product>>(path, { ...query, page, size: MAX_PAGE })
    res.content.forEach((p) => seen.set(p.id, p))
    if (res.last || res.content.length === 0 || page >= res.totalPages - 1) break
    page++
  }
  return [...seen.values()]
}

/** GET /api/products/filter?live=&categoryId= (all pages) */
function loadCatalogue(opts: { categoryId?: number; includeHidden?: boolean } = {}): Promise<Product[]> {
  const key = `${opts.categoryId ?? 'all'}:${opts.includeHidden ? 'all' : 'live'}`
  const cached = listCache.get(key)
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data
  const data = fetchAllPages('/products/filter', {
    categoryId: opts.categoryId,
    live: opts.includeHidden ? undefined : true,
  }).then(remember)
  data.catch(() => listCache.delete(key))
  listCache.set(key, { at: Date.now(), data })
  return data
}

const finalPrice = (p: Product) => effectivePrice(p.price, p.discount)
const byNewest = (a: Product, b: Product) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')

function sortProducts(list: Product[], sort: ProductQuery['sort']) {
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => finalPrice(a) - finalPrice(b))
    case 'price-desc':
      return list.sort((a, b) => finalPrice(b) - finalPrice(a))
    case 'discount':
      return list.sort((a, b) => b.discount - a.discount)
    case 'rating':
      return list.sort((a, b) => averageRating(b.reviews).rating - averageRating(a.reviews).rating)
    default:
      return list.sort(byNewest)
  }
}

export const productService = {
  async getProducts(query: ProductQuery = {}): Promise<PagedResponse<Product>> {
    const { search, categoryId, minPrice, maxPrice, sort = 'newest', page = 0, size = 12 } = query
    const q = search?.trim().toLowerCase()
    const filtered = (await loadCatalogue({ categoryId })).filter((p) => {
      if (q && !`${p.title} ${p.shortDesc}`.toLowerCase().includes(q)) return false
      const price = finalPrice(p)
      if (minPrice !== undefined && price < minPrice) return false
      if (maxPrice !== undefined && price > maxPrice) return false
      return true
    })
    sortProducts(filtered, sort)
    const totalPages = Math.max(1, Math.ceil(filtered.length / size))
    const content = filtered.slice(page * size, page * size + size)
    return {
      content,
      pageNumber: page,
      pageSize: size,
      totalElements: filtered.length,
      totalPages,
      numberOfElements: content.length,
      first: page === 0,
      last: page >= totalPages - 1,
    }
  },

  /** Every product including hidden ones (admin). GET /api/products (all pages) */
  async getAll(): Promise<Product[]> {
    return remember(await fetchAllPages('/products', {}))
  },

  /** GET /api/products/{productId} */
  async getById(id: string): Promise<Product> {
    const product = await api.products.get<Product>(`/products/${id}`)
    productCache.set(product.id, product)
    return product
  },

  /** Resolve many products (e.g. to show images for cart/order lines), using the cache first. */
  async getMany(ids: string[]): Promise<Map<string, Product>> {
    const missing = [...new Set(ids)].filter((id) => !productCache.has(id))
    await Promise.all(missing.map((id) => productService.getById(id).catch(() => null)))
    return new Map(ids.filter((id) => productCache.has(id)).map((id) => [id, productCache.get(id)!]))
  },

  cached: (id: string) => productCache.get(id),

  async getDeals(limit = 8) {
    return sortProducts(await loadCatalogue(), 'discount').filter((p) => p.discount > 0).slice(0, limit)
  },

  async getNewArrivals(limit = 8) {
    return sortProducts(await loadCatalogue(), 'newest').slice(0, limit)
  },

  async getTopRated(limit = 8) {
    return sortProducts(await loadCatalogue(), 'rating').slice(0, limit)
  },

  /** Same-category products. GET /api/products/filter?categoryId= */
  async getRelated(product: Product, limit = 4) {
    const categoryId = product.categories[0]?.id
    const list = await loadCatalogue({ categoryId })
    return list.filter((p) => p.id !== product.id).slice(0, limit)
  },

  /** POST /api/products (ADMIN) */
  async create(input: ProductInput): Promise<Product> {
    const product = await api.products.post<Product>('/products', input)
    listCache.clear()
    return product
  },

  /** PUT /api/products/{productId} (ADMIN) */
  async update(id: string, input: ProductInput): Promise<Product> {
    const product = await api.products.put<Product>(`/products/${id}`, input)
    productCache.set(id, product)
    listCache.clear()
    return product
  },

  /** DELETE /api/products/{productId} (ADMIN) */
  async remove(id: string): Promise<void> {
    await api.products.delete(`/products/${id}`)
    productCache.delete(id)
    listCache.clear()
  },

  toInput(p: Product): ProductInput {
    return {
      title: p.title,
      shortDesc: p.shortDesc,
      longDesc: p.longDesc,
      price: p.price,
      discount: p.discount ?? 0,
      live: p.live,
      productImages: p.productImages ?? [],
      categories: (p.categories ?? []).map((c: Category) => ({ id: c.id, title: c.title })),
    }
  },
}
