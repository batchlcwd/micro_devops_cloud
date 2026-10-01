Create a modern, responsive e-commerce frontend application using:

* React
* Vite
* Tailwind CSS
* shadcn/ui
* Zustand for state management
* React Router
* Lucide React icons

For now, use realistic dummy/mock data. Keep the architecture clean so REST APIs can easily be connected later.

## Customer Pages

Create these pages:

1. Home Page

    * Navbar
    * Hero section
    * Featured products
    * Categories
    * New arrivals / popular products
    * Footer

2. Product Listing Page

    * Product grid
    * Search
    * Category filter
    * Price filter
    * Sort by price/popularity
    * Pagination

3. Product Details Page

    * Product images
    * Product name
    * Price
    * Stock availability
    * Description
    * Quantity selector
    * Add to cart button
    * Related products

4. Cart Page

    * Cart items
    * Update quantity
    * Remove item
    * Cart subtotal
    * Total amount
    * Proceed to checkout

5. Checkout Page

    * Shipping address form
    * Order summary
    * Payment section
    * Razorpay payment button

For now, mock the Razorpay payment flow. Keep payment logic separated so the real Razorpay API can be integrated later.

6. Orders Page

    * Show user's previous orders
    * Order number
    * Products
    * Amount
    * Payment status
    * Order status
    * Order date

7. Order Details Page

    * Complete order information
    * Shipping details
    * Payment details
    * Order status

## Admin Dashboard

Create a separate admin layout with sidebar navigation.

Dashboard should show:

* Total products
* Total orders
* Revenue
* Low stock products
* Recent orders

Admin pages:

### Products

* Product list
* Add product
* Edit product
* Delete product
* Product image, name, category, price and status

### Inventory

* View stock quantity
* Update stock
* Show low-stock and out-of-stock indicators

### Orders

* Order list
* View order details
* Filter by status
* Update order status:

    * Pending
    * Confirmed
    * Shipped
    * Delivered
    * Cancelled

## State Management

Use Zustand stores for:

* Cart
* Products
* Orders
* User/admin state where required

Persist cart in localStorage.

## Project Structure

Keep code modular:

src/

* components/
* pages/
* layouts/
* stores/
* services/
* data/
* hooks/
* lib/
* types/

Put all dummy data inside the `data` folder.

Create a `services` layer so later dummy data can easily be replaced with Spring Boot REST API calls without changing UI components.

## UI Requirements

Use shadcn/ui components wherever appropriate.

Design should be:

* Modern
* Clean
* Professional
* Responsive
* Mobile friendly
* Suitable for a real production e-commerce application

Use skeleton loaders, empty states, badges, cards, tables, dialogs, dropdowns and toast notifications where appropriate.

Do not connect any backend API yet.

Build the complete frontend with working navigation, dummy data, cart functionality, admin management flows and mocked Razorpay checkout.
