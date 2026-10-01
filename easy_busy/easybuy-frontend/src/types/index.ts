/**
 * Domain types mirroring the Spring Boot DTOs:
 * products-service (ProductDto, CategoryDto, ReviewDto, PagedResponse),
 * cart-order-service (CartResponse, OrderResponse, CheckoutRequest),
 * inventory-service (InventoryResponse), payment-service (PaymentResponse,
 * RazorpayOrderResponse) and users-service (UserDto, LoginResponse).
 */

export type ID = string

// ---------- Catalogue ----------

export interface Category {
  id: number
  title: string
}

export interface Review {
  id: number
  title: string
  comment: string
  rating: number
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
  categories: Category[]
  reviews?: Review[]
  createdAt?: string
  updatedAt?: string
}

/** Body for POST/PUT /api/products */
export interface ProductInput {
  title: string
  shortDesc: string
  longDesc: string
  price: number
  discount: number
  live: boolean
  productImages: string[]
  categories: Category[]
}

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

export type ProductSort = 'newest' | 'price-asc' | 'price-desc' | 'discount' | 'rating'

export interface ProductQuery {
  search?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  sort?: ProductSort
  page?: number
  size?: number
}

// ---------- Inventory ----------

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
  totalQuantity: number
  lowStock: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateInventoryRequest {
  productId: ID
  sku: string
  productName: string
  warehouseLocation: string
  availableQuantity: number
  reorderLevel: number
  active: boolean
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

// ---------- Cart ----------

/** Cart line used by the UI (guest cart in localStorage, or mapped from CartResponse). */
export interface CartItem {
  productId: ID
  title: string
  image?: string
  /** Final price per unit after discount */
  unitPrice: number
  discount: number
  quantity: number
}

export interface CartResponse {
  id: number
  userId: string
  status: 'ACTIVE' | 'CHECKED_OUT'
  totalAmount: number
  items: {
    id: number
    productId: ID
    productTitle: string
    unitPrice: number
    discountPercent: number
    quantity: number
    lineTotal: number
  }[]
}

// ---------- Orders ----------

export const ORDER_STATUSES = ['CONFIRMED', 'IN_PROGRESS', 'DISPATCHED', 'OUT_OF_DELIVERY', 'DELIVERED', 'CANCELLED'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export type PaymentMethod = 'ONLINE' | 'OFFLINE'

export interface OrderItem {
  id: number
  productId: ID
  productTitle: string
  /** Final unit price (discount already applied by the backend) */
  unitPrice: number
  discountPercent: number
  quantity: number
  lineTotal: number
}

export interface Order {
  id: number
  orderNumber: string
  userId: string
  billingName: string
  billingPhone: string
  shippingAddress: string
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  extraInformation?: string
  status: OrderStatus
  totalAmount: number
  items: OrderItem[]
  createdAt: string
  updatedAt?: string
  cancelledAt?: string
}

/** Body for POST /api/orders/{userId}/checkout */
export interface CheckoutRequest {
  billingName: string
  billingPhone: string
  shippingAddress: string
  paymentMethod: PaymentMethod
  extraInformation?: string
  paymentDetails?: string
}

/** Structured address form, serialised into CheckoutRequest.shippingAddress */
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

// ---------- Payments ----------

export interface PaymentTransaction {
  id: number
  transactionId: string
  orderId: number
  amount: number
  paymentMethod: PaymentMethod
  status: PaymentStatus
  paymentGatewayTxnId?: string
  createdAt?: string
  updatedAt?: string
}

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

export type UserRole = 'GUEST' | 'USER' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  phoneNumber?: string
  address?: string
  role: UserRole
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phoneNumber?: string
  address?: string
}
