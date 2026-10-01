/**
 * In-memory mock database seeded from `src/data`, persisted to localStorage so
 * admin edits and placed orders survive a page reload. Delete this file once
 * every service talks to the real backend.
 */
import { categories } from '@/data/categories'
import { inventory } from '@/data/inventory'
import { orders } from '@/data/orders'
import { products } from '@/data/products'
import type { Category, InventoryItem, Order, Product } from '@/types'

const STORAGE_KEY = 'easybuy-mock-db-v1'

interface MockDb {
  products: Product[]
  categories: Category[]
  inventory: InventoryItem[]
  orders: Order[]
}

const seed = (): MockDb => structuredClone({ products, categories, inventory, orders })

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MockDb
  } catch {
    /* fall through to seed */
  }
  return seed()
}

export const db: MockDb = load()

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    /* storage full or unavailable – keep in memory only */
  }
}

export function resetDb() {
  localStorage.removeItem(STORAGE_KEY)
  Object.assign(db, seed())
}

export const clone = <T>(v: T): T => structuredClone(v)
