# 🚀 Easy Buy E-Commerce - Frontend API Integration Guide

This guide provides frontend developers with verified API specifications, payload schemas, headers, query parameters, enum constraints, and example integration code for the **Easy Buy** microservices architecture.

---

## 📌 1. Infrastructure & Service Ports

All microservices register with Eureka Discovery Server and route through API Gateway or direct service ports during development.

| Service | Port | Base Path | Description |
| :--- | :--- | :--- | :--- |
| **Eureka Discovery Server** | `8761` | `http://localhost:8761` | Service Registry Dashboard |
| **Config Server** | `8079` | `http://localhost:8079` | Centralized Configuration |
| **API Gateway** | `8080` | `http://localhost:8080/api` | Unified API Gateway Routing |
| **Users Service** | `8085` | `http://localhost:8085/api/users` | Authentication, JWT, User Management |
| **Products Service** | `8081` | `http://localhost:8081/api` | Product Catalog, Categories, Reviews |
| **Cart & Order Service** | `8082` | `http://localhost:8082/api` | Shopping Cart, Order Checkout, SAGA Orchestration |
| **Inventory Service** | `8083` | `http://localhost:8083/api/inventories` | Stock Management, SKU Reservation |
| **Payment Service** | `8086` | `http://localhost:8086/api/payments` | Payment Gateway (Razorpay / Generic) |
| **Notifications Service** | `8087` | `http://localhost:8087/api/notifications` | Email / SMS Alerts |
| **AI Service** | `8088` | `http://localhost:8088/api/ai` | AI Product Recommendations & Descriptions |

---

## 🔑 2. Authentication & User Management

### User Registration
* **Endpoint**: `POST /api/users` (Direct: `http://localhost:8085/api/users`)
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "password": "Password123!",
    "phoneNumber": "+1234567890",
    "address": "123 Main St, New York, NY",
    "role": "GUEST"
  }
  ```
  > [!IMPORTANT]
  > Accepted values for `role` are `"GUEST"` or `"ADMIN"`.

* **Response (`201 Created` / `200 OK`)**:
  ```json
  {
    "id": "f86c355b-f0f4-48e4-a4e4-2d19420dec34",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "phoneNumber": "+1234567890",
    "address": "123 Main St, New York, NY",
    "role": "GUEST"
  }
  ```

### User Login
* **Endpoint**: `POST /api/users/login` (Direct: `http://localhost:8085/api/users/login`)
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "email": "johndoe@example.com",
    "password": "Password123!"
  }
  ```
* **Response (`200 OK`)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiR1VFU1QiLCJ0eXBlIjoiYWNjZXNzX3Rva2VuI..."
  }
  ```
  > [!TIP]
  > Store the returned `accessToken` in `localStorage` or `sessionStorage` and include it in HTTP request headers:  
  > `Authorization: Bearer <accessToken>`

---

## 🛒 3. Product Catalog APIs

### Get All Products (Paged)
* **Endpoint**: `GET /api/products?page=0&size=12` (Direct: `http://localhost:8081/api/products`)
* **Response (`200 OK`)**:
  ```json
  {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "iPhone 15 Pro",
        "shortDesc": "Titanium design, A17 Pro chip, Action button.",
        "longDesc": "The iPhone 15 Pro features a strong and light aerospace-grade titanium design...",
        "price": 999.99,
        "discount": 5,
        "live": true,
        "productImages": ["https://example.com/images/iphone15pro.jpg"],
        "categories": [{ "id": 1, "title": "Electronics" }],
        "reviews": []
      }
    ],
    "pageNumber": 0,
    "pageSize": 12,
    "totalElements": 3,
    "totalPages": 1,
    "first": true,
    "last": true
  }
  ```

### Search Products
* **Endpoint**: `GET /api/products/search?q={query}&page=0&size=12` (Direct: `http://localhost:8081/api/products/search?q=iPhone`)
  > [!NOTE]
  > The required query parameter is `q` (e.g. `?q=iPhone`).

### Filter Products by Price, Category, and Live Status
* **Endpoint**: `GET /api/products/filter?minPrice=100&maxPrice=500&categoryId=1&live=true&page=0&size=12`

### Get Product by ID
* **Endpoint**: `GET /api/products/{productId}` (e.g. `/api/products/550e8400-e29b-41d4-a716-446655440000`)

### Get All Categories
* **Endpoint**: `GET /api/categories` (Direct: `http://localhost:8081/api/categories`)
* **Response (`200 OK`)**:
  ```json
  [
    { "id": 1, "title": "Electronics" },
    { "id": 2, "title": "Clothing" },
    { "id": 3, "title": "Books" }
  ]
  ```

---

## 🛍️ 4. Cart Management APIs

### Get User Cart
* **Endpoint**: `GET /api/carts/{userId}` (Direct: `http://localhost:8082/api/carts/johndoe@example.com`)
* **Response (`200 OK`)**:
  ```json
  {
    "id": 11,
    "userId": "johndoe@example.com",
    "status": "ACTIVE",
    "totalAmount": 1899.98,
    "items": [
      {
        "id": 11,
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "productTitle": "iPhone 15 Pro",
        "unitPrice": 949.99,
        "discountPercent": 5,
        "quantity": 2,
        "lineTotal": 1899.98
      }
    ]
  }
  ```

### Add Item to Cart
* **Endpoint**: `POST /api/carts/{userId}/items`
* **Request Body**:
  ```json
  {
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 2
  }
  ```

### Update Cart Item Quantity
* **Endpoint**: `PUT /api/carts/{userId}/items/{productId}`
* **Request Body**:
  ```json
  {
    "quantity": 3
  }
  ```

### Remove Item from Cart
* **Endpoint**: `DELETE /api/carts/{userId}/items/{productId}`

### Clear Cart
* **Endpoint**: `DELETE /api/carts/{userId}`

---

## 📦 5. Order & Checkout APIs

### Checkout Cart
* **Endpoint**: `POST /api/orders/{userId}/checkout` (Direct: `http://localhost:8082/api/orders/johndoe@example.com/checkout`)
* **Request Body**:
  ```json
  {
    "billingName": "John Doe",
    "billingPhone": "+1234567890",
    "shippingAddress": "123 Main St, New York, NY",
    "paymentMethod": "ONLINE",
    "paymentDetails": "1234-5678-9876-5432",
    "extraInformation": "Deliver before 5 PM"
  }
  ```
  > [!IMPORTANT]
  > Required fields: `billingName`, `billingPhone`, `shippingAddress`, `paymentMethod`.  
  > Accepted values for `paymentMethod` are `"ONLINE"` or `"OFFLINE"`.

* **Response (`200 OK`)**:
  ```json
  {
    "id": 10,
    "orderNumber": "d86fba47-1f05-4765-87c7-79356464c30c",
    "userId": "johndoe@example.com",
    "billingName": "John Doe",
    "billingPhone": "+1234567890",
    "shippingAddress": "123 Main St, New York, NY",
    "paymentMethod": "ONLINE",
    "paymentStatus": "PENDING",
    "status": "CONFIRMED",
    "totalAmount": 1899.98,
    "items": [
      {
        "id": 10,
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "productTitle": "iPhone 15 Pro",
        "unitPrice": 949.99,
        "discountPercent": 5,
        "quantity": 2,
        "lineTotal": 1899.98
      }
    ],
    "createdAt": "2026-10-01T13:33:06.671027100Z"
  }
  ```

### Get Order History by User
* **Endpoint**: `GET /api/orders/user/{userId}` (Direct: `http://localhost:8082/api/orders/user/johndoe@example.com`)

### Get Order by ID
* **Endpoint**: `GET /api/orders/{orderId}` (e.g. `/api/orders/10`)

---

## 💳 6. Payment APIs

### Get Payment by Order ID
* **Endpoint**: `GET /api/payments/order/{orderId}` (Direct: `http://localhost:8086/api/payments/order/10`)
* **Response (`200 OK`)**:
  ```json
  {
    "id": 6,
    "transactionId": "3b0dfb92-7397-4285-aa64-5f1ba53e0f83",
    "orderId": 10,
    "amount": 1899.98,
    "paymentMethod": "ONLINE",
    "status": "PAID",
    "paymentGatewayTxnId": "GATEWAY-PAID-6A58CAC5",
    "createdAt": "01-10-2026 13:33:08"
  }
  ```

### Create Razorpay Order
* **Endpoint**: `POST /api/payments/razorpay/create-order?orderId={orderId}&amount={amount}`

---

## 🤖 7. AI Assistant APIs

### Get Category Recommendations for User
* **Endpoint**: `GET /api/ai/recommendations/{userId}` (Direct: `http://localhost:8088/api/ai/recommendations/johndoe@example.com`)
* **Response (`200 OK`)**:
  ```json
  [
    "Electronics",
    "Smart Watches",
    "Fitness Trackers",
    "Headphones",
    "Accessories"
  ]
  ```

---

## 💻 8. React / JavaScript Integration Examples

### Axios Setup with JWT Interceptor
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Or direct microservice ports
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Add to Cart & Checkout Flow Example
```javascript
// 1. Add item to cart
async function addToCart(userId, productId, quantity = 1) {
  const response = await api.post(`http://localhost:8082/api/carts/${userId}/items`, {
    productId,
    quantity,
  });
  return response.data;
}

// 2. Perform Order Checkout
async function checkoutCart(userId, shippingData) {
  const payload = {
    billingName: shippingData.name,
    billingPhone: shippingData.phone,
    shippingAddress: shippingData.address,
    paymentMethod: 'ONLINE', // "ONLINE" or "OFFLINE"
    paymentDetails: 'Razorpay / Credit Card',
    extraInformation: shippingData.notes || '',
  };

  const response = await api.post(`http://localhost:8082/api/orders/${userId}/checkout`, payload);
  return response.data;
}
```
