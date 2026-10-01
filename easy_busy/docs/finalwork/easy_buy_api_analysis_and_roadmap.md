# 📊 Easy Buy E-Commerce: API Analysis, Status & Roadmap

> **Document Version**: `1.0.0`  
> **Target Workspace**: `easy_busy` (Microservices Backend)  
> **Framework**: Spring Boot 3.x / 4.x, Spring Cloud, Netflix Eureka, Spring Cloud Gateway, Kafka, Docker & Kubernetes (EKS)  
> **Default Gateway Port**: `8080` (Base URL: `http://localhost:8080`)  

---

## 📌 Executive Summary

Easy Buy is an enterprise-grade e-commerce backend built on a **microservices architecture** using Spring Boot, Spring Cloud, Apache Kafka, and resilience patterns (Resilience4j).

A complete analysis across the codebase and Git history reveals:
* **~45 Active Endpoints on `main` branch** covering User Authentication & Roles, Product & Category Catalog, Reviews, Inventory Pessimistic Locking, Shopping Cart management, and Order Checkout Orchestration.
* **6 Additional Endpoints on `working` branch** implementing Razorpay payment flow, email notifications, and AI product recommendations/descriptions that have not yet been merged into `main`.
* **Key Functional Gaps Identified**: Catalog search & multi-attribute filtering, payment gateway webhooks, multi-step order lifecycle transitions (`SHIPPED`, `DELIVERED`), atomic multi-item stock reservation, address book management, and promotional discount coupons.

---

## 🗂️ 1. Services Status & Branch Matrix

| Microservice | Port | Gateway Path | Status (`main`) | Status (`working`) | Next Action Required |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **`users-service`** | `8083` | `/users/**` | 🟢 Completed | 🟢 Completed | Production ready; needs address book & profile endpoint |
| **`products-service`** | `8081` | `/products/**` | 🟢 Completed | 🟢 Completed | Production ready; needs search & filter endpoints |
| **`inventory-service`** | `8082` | `/inventories/**` | 🟢 Completed | 🟢 Completed | Verified with pessimistic locks; needs batch reserve & commit |
| **`cart-order-service`** | `8084` | `/cart-orders/**` | 🟢 Completed | 🟢 Completed | Verified checkout & stock rollback; needs admin order management |
| **`payment-service`** | `8085` | *Not configured* | 🟡 Mock / Sim | 🟢 Razorpay Integrated | Merge `working`, add webhooks & gateway route |
| **`notifications-service`**| `8086` | *Not configured* | 🔴 Skeleton | 🟢 Email & Kafka | Merge `working`, configure SMTP, add gateway route |
| **`ai-service`** | `8087` | *Not configured* | 🔴 Skeleton | 🟢 AI Endpoints | Merge `working`, connect LLM / Spring AI, add gateway route |
| **`api-gateway`** | `8080` | `/` | 🟢 Completed | 🟢 Completed | Add route definitions for payments, notifications, & AI |
| **`service-discovery`** | `8761` | `/` | 🟢 Completed | 🟢 Completed | Eureka Server active |
| **`config-server`** | `8888` | `/` | 🟢 Completed | 🟢 Completed | Spring Cloud Config active |

---

## 🛠️ 2. Comprehensive Inventory of Created APIs

### 👤 2.1 Users Service (`users-service`)
**Base Path**: `/api/users`  
**Authentication**: JWT (HS256) with Role-Based Access Control (`ADMIN`, `USER`, `GUEST`)

| HTTP Method | Path | Access Level | Description | Request / Body | Response Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Public | Register a new user | `UserDto` (name, email, password, phone, address, role) | `201 Created` |
| `POST` | `/login` | Public | Authenticate user credentials & issue JWT tokens | `LoginRequest` (email, password) | `200 OK` (`LoginResponse` with tokens) |
| `POST` | `/refresh` | Public | Issue new access token using valid refresh token | `TokenRefreshRequest` (refreshToken) | `200 OK` (`TokenRefreshResponse`) |
| `GET` | `/{id}` | USER / ADMIN | Fetch user details by UUID | `id` path variable | `200 OK` (`UserDto`) |
| `GET` | `/email/{email}` | USER / ADMIN | Fetch user details by email address | `email` path variable | `200 OK` (`UserDto`) |
| `GET` | `/` | ADMIN | Fetch all registered users | None | `200 OK` (`List<UserDto>`) |
| `PUT` | `/{id}` | USER / ADMIN | Update user profile info | `UserDto` (name, phone, address) | `200 OK` (`UserDto`) |
| `DELETE` | `/{id}` | ADMIN | Delete user account | `id` path variable | `204 No Content` |
| `PUT` | `/change-role` | ADMIN | Update user role (`USER`, `ADMIN`, `GUEST`) | `ChangeRoleRequest` (userId, role) | `204 No Content` |

---

### 📦 2.2 Products Service (`products-service`)
**Base Path**: `/api`

#### A. Categories (`/api/categories`)
| HTTP Method | Path | Access Level | Description | Request / Body | Response Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Retrieve all categories | None | `200 OK` (`List<CategoryDto>`) |
| `GET` | `/{categoryId}` | Public | Get single category by ID | `categoryId` path variable | `200 OK` (`CategoryDto`) |
| `GET` | `/product/{productId}` | Public | List categories linked to a product | `productId` (UUID) | `200 OK` (`List<CategoryDto>`) |
| `POST` | `/` | ADMIN | Create a new category | `CategoryDto` (name, description) | `201 Created` (`CategoryDto`) |
| `PUT` | `/{categoryId}` | ADMIN | Update category details | `CategoryDto` | `200 OK` (`CategoryDto`) |
| `DELETE` | `/{categoryId}` | ADMIN | Delete category | `categoryId` path variable | `204 No Content` |

#### B. Products (`/api/products`)
| HTTP Method | Path | Access Level | Description | Request / Body | Response Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | List products (paginated) | `page` (default 0), `size` (default 12) | `200 OK` (`PagedResponse<ProductDto>`) |
| `GET` | `/{productId}` | Public | Get product details by UUID | `productId` (UUID) | `200 OK` (`ProductDto`) |
| `GET` | `/category/{categoryId}` | Public | List products under a specific category | `categoryId`, `page`, `size` | `200 OK` (`PagedResponse<ProductDto>`) |
| `POST` | `/` | ADMIN | Create a new product item | `ProductDto` (title, shortDesc, longDesc, price, discount, live, categories) | `201 Created` (`ProductDto`) |
| `PUT` | `/{productId}` | ADMIN | Update product details | `ProductDto` | `200 OK` (`ProductDto`) |
| `DELETE` | `/{productId}` | ADMIN | Delete product | `productId` (UUID) | `204 No Content` |
| `POST` | `/{productId}/categories/{categoryId}` | ADMIN | Link product to a category | Path parameters | `200 OK` (`ProductDto`) |
| `DELETE` | `/{productId}/categories/{categoryId}` | ADMIN | Unlink category from product | Path parameters | `200 OK` (`ProductDto`) |
| `POST` | `/{productId}/images` | ADMIN | Upload product images to ImageKit | `multipart/form-data` with `files` list | `200 OK` (`ProductDto`) |
| `GET` | `/{productId}/images` | Public | Get list of image URLs for product | `productId` (UUID) | `200 OK` (`List<String>`) |
| `GET` | `/imgkit-folder` | ADMIN | Fetch configured ImageKit target folder | None | `200 OK` (`String`) |

#### C. Reviews (`/api/reviews`)
| HTTP Method | Path | Access Level | Description | Request / Body | Response Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | List all customer reviews | None | `200 OK` (`List<ReviewDto>`) |
| `GET` | `/{reviewId}` | Public | Get review by ID | `reviewId` path variable | `200 OK` (`ReviewDto`) |
| `GET` | `/product/{productId}` | Public | List all reviews for a product | `productId` (UUID) | `200 OK` (`List<ReviewDto>`) |
| `POST` | `/product/{productId}` | USER / ADMIN | Add review to product | `ReviewDto` (reviewerName, rating, comment) | `201 Created` (`ReviewDto`) |
| `PUT` | `/{reviewId}` | USER / ADMIN | Update review comment/rating | `ReviewDto` | `200 OK` (`ReviewDto`) |
| `DELETE` | `/{reviewId}` | ADMIN | Delete review | `reviewId` path variable | `204 No Content` |

---

### 🏭 2.3 Inventory Service (`inventory-service`)
**Base Path**: `/api/inventories`  
**Key Feature**: Pessimistic Read/Write DB Locks (`PESSIMISTIC_WRITE`) to prevent overselling under high concurrency.

| HTTP Method | Path | Access Level | Description | Request / Body | Response Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | ADMIN | Initialize inventory item / SKU | `CreateInventoryRequest` (productId, sku, productName, warehouseLocation, availableQuantity, reorderLevel) | `201 Created` (`InventoryResponse`) |
| `GET` | `/` | ADMIN | List all inventory records | None | `200 OK` (`List<InventoryResponse>`) |
| `GET` | `/{id}` | ADMIN | Get inventory by ID | `id` path variable | `200 OK` (`InventoryResponse`) |
| `GET` | `/sku/{sku}` | ADMIN | Get stock record by SKU | `sku` path variable | `200 OK` (`InventoryResponse`) |
| `GET` | `/product/{productId}` | ADMIN / Internal | Get stock record by Product UUID | `productId` (UUID) | `200 OK` (`InventoryResponse`) |
| `GET` | `/low-stock` | ADMIN | List low-stock alerts | `threshold` (default 10) | `200 OK` (`List<InventoryResponse>`) |
| `PUT` | `/{id}` | ADMIN | Update inventory metadata | `UpdateInventoryRequest` (productName, warehouseLocation, reorderLevel, active) | `200 OK` (`InventoryResponse`) |
| `PATCH` | `/{id}/adjust-stock` | ADMIN | Increment/decrement available stock | `AdjustStockRequest` (`quantityChange`) | `200 OK` (`InventoryResponse`) |
| `POST` | `/{id}/reserve` | Internal / Cart | Lock & reserve stock by inventory ID | `ReserveStockRequest` (`quantity`) | `200 OK` (`InventoryResponse`) |
| `POST` | `/{id}/release` | Internal / Cart | Release reserved stock by inventory ID | `ReleaseStockRequest` (`quantity`) | `200 OK` (`InventoryResponse`) |
| `POST` | `/product/{productId}/reserve` | Internal / Cart | Lock & reserve stock by Product UUID | `ReserveStockRequest` (`quantity`) | `200 OK` (`InventoryResponse`) |
| `POST` | `/product/{productId}/release` | Internal / Cart | Release reserved stock by Product UUID | `ReleaseStockRequest` (`quantity`) | `200 OK` (`InventoryResponse`) |
| `DELETE` | `/{id}` | ADMIN | Delete inventory item | `id` path variable | `204 No Content` |

---

### 🛒 2.4 Cart & Order Service (`cart-order-service`)
**Base Path**: `/api`

#### A. Shopping Carts (`/api/carts`)
| HTTP Method | Path | Access Level | Description | Request / Body | Response Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/{userId}` | USER / GUEST | Retrieve active cart with line items & total price | `userId` path variable | `200 OK` (`CartResponse`) |
| `POST` | `/{userId}/items` | USER / GUEST | Add product to cart (or increment quantity) | `AddCartItemRequest` (productId, quantity) | `200 OK` (`CartResponse`) |
| `PUT` | `/{userId}/items/{productId}` | USER / GUEST | Update item quantity in cart | `UpdateCartItemRequest` (`quantity`) | `200 OK` (`CartResponse`) |
| `DELETE` | `/{userId}/items/{productId}` | USER / GUEST | Remove specific product from cart | Path parameters | `200 OK` (`CartResponse`) |
| `DELETE` | `/{userId}` | USER / GUEST | Empty entire cart | `userId` path variable | `204 No Content` |

#### B. Orders & Checkout (`/api/orders`)
| HTTP Method | Path | Access Level | Description | Request / Body | Response Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/{userId}/checkout` | USER / GUEST | Checkout active cart: reserves inventory, creates order, clears cart, publishes `order-topic` Kafka event. Performs stock rollback if reserve fails. | `CheckoutRequest` (billingName, billingPhone, shippingAddress, extraInfo, paymentMethod) | `200 OK` (`OrderResponse`) |
| `GET` | `/{orderId}` | USER / ADMIN | Get order details by ID | `orderId` path variable | `200 OK` (`OrderResponse`) |
| `GET` | `/number/{orderNumber}` | USER / ADMIN | Look up order by unique order number | `orderNumber` path variable | `200 OK` (`OrderResponse`) |
| `GET` | `/user/{userId}` | USER / ADMIN | Retrieve all orders history for a user | `userId` path variable | `200 OK` (`List<OrderResponse>`) |
| `DELETE` | `/{orderId}` | USER / ADMIN | Cancel order & release reserved stock in inventory | `orderId` path variable | `200 OK` (`OrderResponse`) |
| `POST` | `/api/test/orders` | Public / Dev | Resilience4j RateLimiter & Retry test endpoint | `OrderCreateRequest` | `200 OK` (`ProductSnapshot`) |

---

### 💳 2.5 Payment Service (`payment-service`)
**Base Path**: `/api/payments`

| HTTP Method | Path | Branch Location | Description | Request / Body | Response Status |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `POST` | `/` | `main` & `working` | Process payment (simulated validation, card decline keywords check) | `PaymentRequest` (orderId, amount, paymentMethod, paymentDetails) | `201 Created` (`PaymentResponse`) |
| `GET` | `/order/{orderId}` | `main` & `working` | Get payment transactions for an order | `orderId` path variable | `200 OK` (`List<PaymentResponse>`) |
| `GET` | `/transaction/{transactionId}` | `main` & `working` | Fetch transaction details by transaction UUID | `transactionId` path variable | `200 OK` (`PaymentResponse`) |
| `POST` | `/razorpay/create-order` | ⚠️ **`working` only** | Create order on Razorpay | Query params: `orderId`, `amount` | `201 Created` (`RazorpayOrderResponse`) |
| `POST` | `/razorpay/verify` | ⚠️ **`working` only** | Verify HMAC SHA256 payment signature & update transaction to `PAID` | `RazorpayVerificationRequest` (orderId, paymentId, signature) | `200 OK` (`PaymentResponse`) |

> [!NOTE]
> **Kafka Consumer (`OrderEventConsumer`)**: Listens on `order-topic` (group: `payment-group`). When an order is placed, it automatically executes `processPayment()` and publishes a `PaymentEvent` back to `payment-topic`.

---

### 🔔 2.6 Notifications Service (`notifications-service`)
**Base Path**: `/api/notifications` *(Located on `working` branch)*

| HTTP Method | Path | Branch Location | Description | Request / Body | Response Status |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `POST` | `/email` | ⚠️ **`working` only** | Send custom formatted email via `JavaMailSender` | `EmailRequest` (toEmail, subject, body) | `200 OK` (`String`) |
| `POST` | `/welcome` | ⚠️ **`working` only** | Send onboarding welcome email | Query params: `email`, `name` | `200 OK` (`String`) |

> [!NOTE]
> **Kafka Consumer (`NotificationEventConsumer`)**: Listens to `order-topic` and sends an order confirmation email to the user automatically upon order placement.

---

### 🤖 2.7 AI Service (`ai-service`)
**Base Path**: `/api/ai` *(Located on `working` branch)*

| HTTP Method | Path | Branch Location | Description | Request / Body | Response Status |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `GET` | `/recommendations/{userId}` | ⚠️ **`working` only** | Returns personalized product categories for user | `userId` path variable | `200 OK` (`List<String>`) |
| `POST` | `/generate-description` | ⚠️ **`working` only** | Auto-generates marketing descriptions for products | Query params: `title`, `category` | `200 OK` (`Map<String, String>`) |

---

### 🛡️ 2.8 API Gateway (`api-gateway`)
**Base Port**: `8080`

* **Route Mapping**:
  * `/products/**` ➔ `PRODUCT-SERVICE` (with Redis Rate Limiting & Circuit Breaker)
  * `/cart-orders/**` ➔ `CART-ORDER-SERVICE` (with retry filter)
  * `/users/**` ➔ `users-service`
  * `/inventories/**` ➔ `INVENTORY-SERVICE`
* **Fallback Endpoint**:
  * `GET /product-fallback` — Circuit breaker fallback message when Product Service is down.
* **Authentication & RBAC Filter**:
  * Validates JWT token on incoming requests.
  * Bypasses public routes (`/api/users/login`, `/api/users/refresh`, `POST /api/users`, `GET /api/products/**`, `GET /api/categories/**`).
  * Enforces `ADMIN` role on modifying catalog, inventory, and user roles.
  * Checks resource ownership for `USER` and `GUEST` (prevents users from inspecting other users' carts/orders).
  * Propagates verified identity downstream via `X-User-Id`, `X-User-Email`, `X-User-Role` headers.

---

## 🚧 3. What APIs Are Left to Implement (Gaps & Roadmap)

To bring the Easy Buy platform to a complete, production-ready e-commerce standard, the following APIs need to be designed and implemented:

```
                               EASY BUY ROADMAP
                               
     CRITICAL (P0)                  IMPORTANT (P1)                ENHANCEMENTS (P2)
┌──────────────────────┐      ┌─────────────────────────┐      ┌──────────────────────┐
│ • Product Search &   │      │ • User Address Book     │      │ • Semantic AI Search │
│   Faceted Filter     │      │ • Forgot / Reset Pwd    │      │ • Customer AI Chat   │
│ • Payment Webhooks   │ ───> │ • Coupons & Discounts   │ ───> │ • SMS & Push Alerts  │
│ • Order Lifecycle    │      │ • Wishlist / Favorites  │      │ • Reviews Sentiment  │
│   Status Updates     │      │ • User Profile /me      │      │ • Multi-Warehouse    │
│ • Batch Stock Lock   │      │ • Invoice Download      │      │ • Product Variants   │
└──────────────────────┘      └─────────────────────────┘      └──────────────────────┘
```

---

### 🔴 Priority 0: Critical Business Endpoints

#### 1. Catalog Search, Sorting & Filtering (`products-service`)
*Currently, products can only be fetched in a flat list or filtered by single category.*
* `GET /api/products/search?q={query}&page=0&size=12` — Full-text keyword search across title, short description, and category.
* `GET /api/products/filter?minPrice={}&maxPrice={}&categoryId={}&inStock=true` — Multi-faceted catalog filter.
* Sorting query parameters on `/api/products`: `sort=price,asc`, `sort=price,desc`, `sort=createdAt,desc`.
* `PATCH /api/products/{productId}/status?live=true|false` — Quick toggle for product visibility.

#### 2. Payment Gateway Webhook & Refunds (`payment-service`)
*In production, payment status is confirmed asynchronously by the gateway.*
* `POST /api/payments/razorpay/webhook` — Webhook endpoint to receive server-to-server notifications from Razorpay (captures edge cases like network drops or window closure after payment).
* `POST /api/payments/refund` — Trigger automated refund when an order is cancelled or returned.
* `GET /api/payments/{transactionId}/status` — Polling endpoint to check live gateway settlement status.

#### 3. Order Lifecycle Management (`cart-order-service`)
*Currently orders can only be created or cancelled. There is no flow for warehouse dispatch or delivery.*
* `GET /api/orders` — Admin endpoint to view, search, and paginate all orders across all customers.
* `PATCH /api/orders/{orderId}/status` — Admin / Delivery agent status transition (`CONFIRMED` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `DELIVERED`).
* `GET /api/orders/{orderId}/track` — Live shipment tracking status and carrier details.

#### 4. Batch Inventory Reservation & Commit (`inventory-service`)
*Currently, `cart-order-service` reserves items sequentially in a `for` loop. If item #3 fails, it must manually roll back #1 and #2.*
* `POST /api/inventories/batch-reserve` — Atomic multi-product reservation in a single database transaction.
* `POST /api/inventories/batch-release` — Atomic multi-product release.
* `POST /api/inventories/commit` (or `/deduct`) — Permanently subtract `reservedQuantity` from `availableQuantity` once payment is confirmed.

---

### 🟡 Priority 1: Important Customer & Store Features

#### 5. User Self-Service, Addresses & Password Recovery (`users-service`)
* `GET /api/users/me` — Return profile of the currently logged-in user using the token in the `Authorization` header.
* `PUT /api/users/change-password` — Change password with old password verification.
* `POST /api/users/forgot-password` & `POST /api/users/reset-password` — Email OTP or secure token reset flow.
* **Address Book Management** *(currently user only has a single flat string `address`)*:
  * `GET /api/users/{userId}/addresses`
  * `POST /api/users/{userId}/addresses`
  * `PUT /api/users/{userId}/addresses/{addressId}`
  * `DELETE /api/users/{userId}/addresses/{addressId}`

#### 6. Promotional Engine & Cart Enhancements (`cart-order-service`)
* `POST /api/carts/{userId}/coupons` — Apply promo code to cart and recalculate discount.
* `DELETE /api/carts/{userId}/coupons/{code}` — Remove applied coupon.
* `POST /api/carts/merge` — Merge anonymous guest cart with authenticated user cart upon login.
* `GET /api/orders/{orderId}/invoice` — Download order receipt or PDF invoice.

#### 7. Customer Wishlist (`products-service` or dedicated service)
* `POST /api/wishlist/{productId}` — Save product for later.
* `GET /api/wishlist` — View saved items.
* `DELETE /api/wishlist/{productId}` — Remove from wishlist.

---

### 🟢 Priority 2: Enhancements & Scalability

#### 8. API Gateway Routing Synchronization (`api-gateway`)
Update [`RouteConfig.java`](file:///D:/Live%20Batches/micro_devops/easy_busy/api-gateway/api-gateway/src/main/java/com/substring/easybuy/apigateway/RouteConfig.java) to add missing routes for:
```java
// Route Payment Service
.route("payment-route", r -> r.path("/payments/**")
    .filters(f -> f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
    .rewritePath("/payments/?(?<remaining>.*)", "/${remaining}"))
    .uri("lb://PAYMENT-SERVICE"))

// Route Notifications Service
.route("notifications-route", r -> r.path("/notifications/**")
    .filters(f -> f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
    .rewritePath("/notifications/?(?<remaining>.*)", "/${remaining}"))
    .uri("lb://NOTIFICATIONS-SERVICE"))

// Route AI Service
.route("ai-route", r -> r.path("/ai/**")
    .filters(f -> f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
    .rewritePath("/ai/?(?<remaining>.*)", "/${remaining}"))
    .uri("lb://AI-SERVICE"))
```

#### 9. AI Service Advanced Capabilities (`ai-service`)
* `GET /api/ai/search?query={prompt}` — Vector-based semantic search with Spring AI & embedding storage.
* `POST /api/ai/chat` — Conversational AI shopping assistant.
* `GET /api/ai/reviews-summary/{productId}` — AI-generated summary of product reviews highlighting key pros and cons.

#### 10. Multi-Channel Notifications (`notifications-service`)
* `POST /api/notifications/sms` — SMS alerts for dispatch and delivery.
* `POST /api/notifications/push` — Web/mobile push notifications.

---

## 🎯 4. Immediate Recommended Action Plan

1. **Synchronize Git Branches:**
   Merge the `working` branch into `main` to bring in `notifications-service`, `ai-service`, and Razorpay payment controller logic.
2. **Expose Missing Routes in API Gateway:**
   Register routes for `/payments/**`, `/notifications/**`, and `/ai/**` in `RouteConfig.java`.
3. **Implement Product Search & Sorting:**
   Add keyword search and price filters to `ProductController.java` to support storefront discovery.
4. **Implement Order Status Transitions:**
   Add `PATCH /api/orders/{orderId}/status` in `OrderController.java` so orders can advance beyond `CONFIRMED`.
5. **Add Razorpay Webhook:**
   Add `/api/payments/razorpay/webhook` to handle asynchronous payment confirmations securely.
