/**
 * Domain types. Field names mirror the Spring Boot DTOs
 * (products-service ProductDto/CategoryDto, cart-order-service OrderResponse,
 * inventory-service InventoryResponse, payment-service Razorpay DTOs)
 * so the services layer can swap mock data for REST calls with minimal mapping.
 */

export type ID = string

export interface Category {
  id: number
  title: string
  slug: string
  image: string
  description?: string
}

export interface Review {
  id: number
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export interface Product {
  id: ID
  title: string
  shortDesc: string
  longDesc: string
  /** MRP before discount */
  price: number
  /** Discount percentage 0-100 */
  discount: number
  live: boolean
  productImages: string[]
  categories: Pick<Category, 'id' | 'title'>[]
  reviews?: Review[]
  brand?: string
  rating?: number
  reviewCount?: number
  /** Units sold – used for "popularity" sorting */
  soldCount?: number
  featured?: boolean
  createdAt: string
  updatedAt: string
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'reviews'>

export interface InventoryItem {
  id: number
  productId: ID
  sku: string
  productName: string
  warehouseLocation: string
  availableQuantity: number
  reservedQuantity: number
  reorderLevel: number
  active: boolean
  updatedAt: string
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

/** Matches Spring's PagedResponse<T> */
export interface PagedResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  numberOfElements: number
  first: boolean
  last: boolean
}

export type ProductSort = 'popularity' | 'price-asc' | 'price-desc' | 'newest' | 'rating'

export interface ProductQuery {
  search?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  sort?: ProductSort
  page?: number
  size?: number
  includeHidden?: boolean
}

// ---------- Cart ----------

export interface CartItem {
  productId: ID
  title: string
  image: string
  price: number
  discount: number
  quantity: number
  maxQuantity: number
}

// ---------- Orders ----------

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export type PaymentMethod = 'ONLINE' | 'OFFLINE'

export interface ShippingAddress {
  fullName: string
  phone: string
  email: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country: string
}

export interface OrderItem {
  id: number
  productId: ID
  productTitle: string
  productImage: string
  unitPrice: number
  discountPercent: number
  quantity: number
  lineTotal: number
}

export interface PaymentInfo {
  method: PaymentMethod
  status: PaymentStatus
  provider?: 'RAZORPAY'
  razorpayOrderId?: string
  razorpayPaymentId?: string
  transactionId?: string
  paidAt?: string
}

export interface OrderStatusEvent {
  status: OrderStatus
  at: string
  note?: string
}

export interface Order {
  id: number
  orderNumber: string
  userId: string
  billingName: string
  billingPhone: string
  shippingAddress: ShippingAddress
  items: OrderItem[]
  subtotal: number
  discountTotal: number
  shippingFee: number
  tax: number
  totalAmount: number
  status: OrderStatus
  payment: PaymentInfo
  extraInformation?: string
  statusHistory: OrderStatusEvent[]
  createdAt: string
  updatedAt: string
  cancelledAt?: string
}

export interface CheckoutRequest {
  userId: string
  shippingAddress: ShippingAddress
  items: CartItem[]
  paymentMethod: PaymentMethod
  extraInformation?: string
}

// ---------- Payments (mirror payment-service DTOs) ----------

export interface RazorpayOrderResponse {
  razorpayOrderId: string
  transactionId: string
  orderId: number
  amount: number
  currency: string
  keyId: string
}

export interface RazorpayVerificationRequest {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

// ---------- Users ----------

export type UserRole = 'CUSTOMER' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  avatar?: string
}

// ---------- Admin ----------

export interface DashboardStats {
  totalProducts: number
  liveProducts: number
  totalOrders: number
  pendingOrders: number
  revenue: number
  lowStockCount: number
  outOfStockCount: number
}
