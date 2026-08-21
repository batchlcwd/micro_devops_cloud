# 📖 Easy Buy E-Commerce API Documentation

This document contains the complete API specifications for the **Easy Buy** E-Commerce backend services, running on Spring Boot and Spring Cloud.

* **API Gateway Port**: `8080` (All microservice endpoints can be routed through the gateway at `http://localhost:8080/api/...`)
* **Default Profile**: `dev`

---

## 📂 Table of Contents
1. [Users Service (`users-service`)](#1-users-service)
2. [Products Service (`products-service`)](#2-products-service)
3. [Inventory Service (`inventory-service`)](#3-inventory-service)
4. [Cart & Order Service (`cart-order-service`)](#4-cart--order-service)
5. [Payment Service (`payment-service`)](#5-payment-service)
6. [Notifications Service (`notifications-service`)](#6-notifications-service)
7. [AI Service (`ai-service`)](#7-ai-service)

---

## 1. Users Service (`users-service`)
**Base URL**: `http://localhost:8080/api/users`

### Register User
* **Method**: `POST`
* **URL**: `/`
* **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "password": "securepassword123",
    "phoneNumber": "+1234567890",
    "address": "123 Main St, New York, NY",
    "role": "USER"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": "e6a256a4-2db3-43ef-b7c4-c2c6114b74a3",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "phoneNumber": "+1234567890",
    "address": "123 Main St, New York, NY",
    "role": "USER",
    "createdAt": "2026-05-30T14:48:57Z",
    "updatedAt": "2026-05-30T14:48:57Z"
  }
  ```

### Get User by ID
* **Method**: `GET`
* **URL**: `/{id}`
* **Response (200 OK)**:
  ```json
  {
    "id": "e6a256a4-2db3-43ef-b7c4-c2c6114b74a3",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "phoneNumber": "+1234567890",
    "address": "123 Main St, New York, NY",
    "role": "USER",
    "createdAt": "2026-05-30T14:48:57Z",
    "updatedAt": "2026-05-30T14:48:57Z"
  }
  ```

### Get User by Email
* **Method**: `GET`
* **URL**: `/email/{email}`
* **Response (200 OK)**: Same as above.

### Get All Users
* **Method**: `GET`
* **URL**: `/`
* **Response (200 OK)**: Array of User objects.

### Update User
* **Method**: `PUT`
* **URL**: `/{id}`
* **Request Body**:
  ```json
  {
    "name": "John Doe Updated",
    "phoneNumber": "+1987654321",
    "address": "456 Oak St, Boston, MA"
  }
  ```
* **Response (200 OK)**: Updated user object.

### Delete User
* **Method**: `DELETE`
* **URL**: `/{id}`
* **Response (244 No Content)**

---

## 2. Products Service (`products-service`)
**Base URL**: `http://localhost:8080/api`

### A. Categories
**Path Prefix**: `/categories`

#### Create Category
* **Method**: `POST`
* **URL**: `/`
* **Request Body**:
  ```json
  {
    "name": "Electronics",
    "description": "Gadgets, smartphones, and computers"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "name": "Electronics",
    "description": "Gadgets, smartphones, and computers"
  }
  ```

#### Get All Categories
* **Method**: `GET`
* **URL**: `/`

#### Get Category by ID
* **Method**: `GET`
* **URL**: `/{categoryId}`

#### Get Categories by Product ID
* **Method**: `GET`
* **URL**: `/product/{productId}`

#### Update Category
* **Method**: `PUT`
* **URL**: `/{categoryId}`

#### Delete Category
* **Method**: `DELETE`
* **URL**: `/{categoryId}`

### B. Products
**Path Prefix**: `/products`

#### Create Product
* **Method**: `POST`
* **URL**: `/`
* **Request Body**:
  ```json
  {
    "title": "Smart Watch",
    "shortDesc": "Fitness smartwatch with heart monitor",
    "longDesc": "Track steps, sleep, oxygen levels with 7 days battery life",
    "price": 99.99,
    "discount": 10,
    "live": true,
    "categories": [
      { "id": 1 }
    ]
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": "b1fa4852-c632-4bf1-81ee-325bdfa95612",
    "title": "Smart Watch",
    "shortDesc": "Fitness smartwatch with heart monitor",
    "longDesc": "Track steps, sleep, oxygen levels with 7 days battery life",
    "price": 99.99,
    "discount": 10,
    "live": true,
    "productImages": [],
    "categories": [
      { "id": 1, "name": "Electronics" }
    ],
    "reviews": []
  }
  ```

#### Get All Products
* **Method**: `GET`
* **URL**: `/?page=0&size=12`

#### Get Product by ID
* **Method**: `GET`
* **URL**: `/{productId}`

#### Get Products by Category ID
* **Method**: `GET`
* **URL**: `/category/{categoryId}?page=0&size=12`

#### Update Product
* **Method**: `PUT`
* **URL**: `/{productId}`

#### Delete Product
* **Method**: `DELETE`
* **URL**: `/{productId}`

#### Link Product to Category
* **Method**: `POST`
* **URL**: `/{productId}/categories/{categoryId}`

#### Remove Product from Category
* **Method**: `DELETE`
* **URL**: `/{productId}/categories/{categoryId}`

#### Upload Product Images
* **Method**: `POST`
* **URL**: `/{productId}/images`
* **Body**: `multipart/form-data` with parameter `files` (array of image files).

#### Get ImageKit Configuration Folder
* **Method**: `GET`
* **URL**: `/imgkit-folder`

### C. Reviews
**Path Prefix**: `/reviews`

#### Submit Review
* **Method**: `POST`
* **URL**: `/product/{productId}`
* **Request Body**:
  ```json
  {
    "reviewerName": "Alice Johnson",
    "rating": 5,
    "comment": "Excellent display and build quality!"
  }
  ```

#### Get All Reviews
* **Method**: `GET`
* **URL**: `/`

#### Get Review by ID
* **Method**: `GET`
* **URL**: `/{reviewId}`

#### Get Reviews by Product ID
* **Method**: `GET`
* **URL**: `/product/{productId}`

#### Update Review
* **Method**: `PUT`
* **URL**: `/{reviewId}`

#### Delete Review
* **Method**: `DELETE`
* **URL**: `/{reviewId}`

---

## 3. Inventory Service (`inventory-service`)
**Base URL**: `http://localhost:8080/api/inventories`

### Initialize Inventory (Create SKU)
* **Method**: `POST`
* **URL**: `/`
* **Request Body**:
  ```json
  {
    "productId": "b1fa4852-c632-4bf1-81ee-325bdfa95612",
    "sku": "SMART-WATCH-BLK",
    "productName": "Smart Watch Black",
    "warehouseLocation": "Aisle 3 Shelf B",
    "availableQuantity": 150,
    "reservedQuantity": 0,
    "reorderLevel": 15,
    "active": true
  }
  ```

### Get All Inventory Records
* **Method**: `GET`
* **URL**: `/`

### Get Inventory by ID
* **Method**: `GET`
* **URL**: `/{id}`

### Get Inventory by SKU
* **Method**: `GET`
* **URL**: `/sku/{sku}`

### Get Inventory by Product ID
* **Method**: `GET`
* **URL**: `/product/{productId}`

### Get Low Stock Alerts
* **Method**: `GET`
* **URL**: `/low-stock?threshold=15`

### Update Inventory Metadata
* **Method**: `PUT`
* **URL**: `/{id}`
* **Request Body**:
  ```json
  {
    "productName": "Smart Watch Black V2",
    "warehouseLocation": "Aisle 4 Shelf C",
    "reorderLevel": 20,
    "active": true
  }
  ```

### Adjust Stock (Increment/Decrement)
* **Method**: `PATCH`
* **URL**: `/{id}/adjust-stock`
* **Request Body**:
  ```json
  {
    "quantityChange": 50
  }
  ```

### Reserve Stock
* **Method**: `POST`
* **URL**: `/{id}/reserve` or `/product/{productId}/reserve`
* **Request Body**:
  ```json
  {
    "quantity": 2
  }
  ```

### Release Stock
* **Method**: `POST`
* **URL**: `/{id}/release` or `/product/{productId}/release`
* **Request Body**:
  ```json
  {
    "quantity": 2
  }
  ```

### Delete Inventory Item
* **Method**: `DELETE`
* **URL**: `/{id}`

---

## 4. Cart & Order Service (`cart-order-service`)
**Base URL**: `http://localhost:8080/api`

### A. Shopping Carts
**Path Prefix**: `/carts`

#### Get Cart for User
* **Method**: `GET`
* **URL**: `/{userId}`
* **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "userId": "johndoe@example.com",
    "status": "ACTIVE",
    "items": [],
    "totalPrice": 0.00
  }
  ```

#### Add Item to Cart
* **Method**: `POST`
* **URL**: `/{userId}/items`
* **Request Body**:
  ```json
  {
    "productId": "b1fa4852-c632-4bf1-81ee-325bdfa95612",
    "quantity": 2
  }
  ```
* **Response (200 OK)**: Cart object containing updated list of items.

#### Update Cart Item Quantity
* **Method**: `PUT`
* **URL**: `/{userId}/items/{productId}`
* **Request Body**:
  ```json
  {
    "quantity": 5
  }
  ```

#### Remove Item from Cart
* **Method**: `DELETE`
* **URL**: `/{userId}/items/{productId}`

#### Clear Entire Cart
* **Method**: `DELETE`
* **URL**: `/{userId}`

---

### B. Orders
**Path Prefix**: `/orders`

#### Checkout Cart
* **Method**: `POST`
* **URL**: `/{userId}/checkout`
* **Request Body**:
  ```json
  {
    "shippingAddress": "456 Oak St, Boston, MA",
    "paymentMethod": "CREDIT_CARD",
    "paymentDetails": "1234-5678-9876-5432"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": 10,
    "orderNumber": "ORD-1776966669-72f",
    "userId": "johndoe@example.com",
    "status": "PENDING",
    "shippingAddress": "456 Oak St, Boston, MA",
    "totalPrice": 449.95,
    "createdAt": "2026-05-30T14:52:23Z",
    "items": [
      {
        "productId": "b1fa4852-c632-4bf1-81ee-325bdfa95612",
        "productTitle": "Smart Watch",
        "quantity": 5,
        "unitPrice": 89.99
      }
    ]
  }
  ```

#### Get Order by ID
* **Method**: `GET`
* **URL**: `/{orderId}`

#### Get Order by Order Number
* **Method**: `GET`
* **URL**: `/number/{orderNumber}`

#### Get Order History by User ID
* **Method**: `GET`
* **URL**: `/user/{userId}`

#### Cancel Order
* **Method**: `DELETE`
* **URL**: `/{orderId}`

---

## 5. Payment Service (`payment-service`)
**Base URL**: `http://localhost:8080/api/payments`

### Process Payment (Simulated / Generic)
* **Method**: `POST`
* **URL**: `/`
* **Request Body**:
  ```json
  {
    "orderId": 10,
    "amount": 449.95,
    "paymentMethod": "ONLINE",
    "paymentDetails": "Credit Card"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "transactionId": "d3b07384-d113-4c9f-b76b-9c299a9a3b6f",
    "orderId": 10,
    "amount": 449.95,
    "paymentMethod": "ONLINE",
    "status": "PAID",
    "paymentGatewayTxnId": "GATEWAY-PAID-EF31A8B2",
    "createdAt": "2026-08-21T21:40:00Z",
    "updatedAt": "2026-08-21T21:40:00Z"
  }
  ```

### Create Razorpay Order
* **Method**: `POST`
* **URL**: `/razorpay/create-order?orderId={orderId}&amount={amount}`
* **Response (201 Created)**:
  ```json
  {
    "razorpayOrderId": "order_MOCK_FB123C4D",
    "transactionId": "e1a5a73e-324f-4d92-9b24-ff4d1b8bc93a",
    "orderId": 10,
    "amount": 449.95,
    "currency": "INR",
    "keyId": "rzp_test_3c1cR1Y1k1x1z1"
  }
  ```

### Verify Razorpay Payment (Signature Verification)
* **Method**: `POST`
* **URL**: `/razorpay/verify`
* **Request Body**:
  ```json
  {
    "razorpayOrderId": "order_MOCK_FB123C4D",
    "razorpayPaymentId": "pay_29384729384",
    "razorpaySignature": "sig_abc123xyz"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": 2,
    "transactionId": "e1a5a73e-324f-4d92-9b24-ff4d1b8bc93a",
    "orderId": 10,
    "amount": 449.95,
    "paymentMethod": "ONLINE",
    "status": "PAID",
    "paymentGatewayTxnId": "pay_29384729384",
    "createdAt": "2026-08-21T21:42:00Z",
    "updatedAt": "2026-08-21T21:42:15Z"
  }
  ```

### Get Payments by Order ID
* **Method**: `GET`
* **URL**: `/order/{orderId}`

### Get Payment by Transaction ID
* **Method**: `GET`
* **URL**: `/transaction/{transactionId}`

---

## 6. Notifications Service (`notifications-service`)
**Base URL**: `http://localhost:8080/api/notifications`

### Send Custom Email
* **Method**: `POST`
* **URL**: `/email`
* **Request Body**:
  ```json
  {
    "toEmail": "customer@example.com",
    "subject": "Discount offer!",
    "body": "Hi, check out our latest offers..."
  }
  ```
* **Response (200 OK)**: `Email sent request processed.`

### Send Welcome Email
* **Method**: `POST`
* **URL**: `/welcome?email={email}&name={name}`
* **Response (200 OK)**: `Welcome email sent request processed.`

---

## 7. AI Service (`ai-service`)
**Base URL**: `http://localhost:8080/api/ai`

### Get Product Recommendations for User
* **Method**: `GET`
* **URL**: `/recommendations/{userId}`
* **Response (200 OK)**:
  ```json
  [
    "Electronics",
    "Smart Watches",
    "Fitness Trackers",
    "Headphones",
    "Accessories"
  ]
  ```

### Generate Product Description
* **Method**: `POST`
* **URL**: `/generate-description?title={title}&category={category}`
* **Response (200 OK)**:
  ```json
  {
    "description": "This is an exceptional Smart Watch. Designed with state-of-the-art materials..."
  }
  ```
