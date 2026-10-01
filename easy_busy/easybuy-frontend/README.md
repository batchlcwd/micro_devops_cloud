# EasyBuy Frontend

Storefront and admin dashboard for the EasyBuy microservices, built with React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), Zustand, React Router and Lucide icons.

It runs entirely on mock data for now. The backend can be wired in through the `services/` layer without touching any UI code.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

Sign in from `/login` with a demo account: **Customer** for shopping and orders, **Admin** for `/admin`.

## Features

**Store**: home (hero, categories, featured, new arrivals/popular), product listing (search, category and price filters, sorting, pagination, all synced to the URL), product details (gallery, live stock, quantity, related products), cart (persisted to localStorage), checkout (address validation, Razorpay or cash on delivery), orders list, and order details (progress tracker, shipping, payment, cancel, retry payment).

**Admin**: dashboard (revenue, orders, products, low-stock alerts, recent orders), product CRUD with a live/hidden toggle, inventory (low and out-of-stock indicators, stock updates), and orders (status filter, inline status changes, details page with an activity log).

## Structure

```
src/
  components/   ui/ (shadcn) · common/ · layout/ · product/ · checkout/ · order/ · admin/
  pages/        store/ · admin/ · LoginPage · NotFoundPage
  layouts/      StoreLayout · AdminLayout
  stores/       cart · auth · product · inventory · order · mockRazorpay (Zustand)
  services/     product · category · inventory · order · payment · auth · dashboard
  services/mock/db.ts   in-memory DB seeded from data/, persisted to localStorage
  data/         all dummy data
  hooks/        useAsync · useAddToCart · useRazorpayPayment · useDebounce · …
  lib/          http client · pricing · formatting · utils
  types/        domain types that mirror the Spring Boot DTOs
```

Data flows **UI → stores/hooks → services → (mock db | REST)**. Components never import `data/` directly.

## Connecting the Spring Boot backend

1. Copy `.env.example` to `.env` and set `VITE_USE_MOCKS=false`.
2. In each service, replace the mock body with the `http` call documented in the method's comment. For example:
   ```ts
   /** REST: GET /api/products/{productId} */
   async getById(id) { return http.get<Product>(`/api/products/${id}`) }
   ```
3. Types already follow `ProductDto`, `PagedResponse`, `OrderResponse`, `InventoryResponse` and `RazorpayOrderResponse`. Two differences still need a mapper in the service:
   - `OrderResponse.shippingAddress` is a `String`, while the frontend uses a structured `ShippingAddress`.
   - The frontend order statuses (`PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED`) differ from the backend enum (`IN_PROGRESS/DISPATCHED/OUT_OF_DELIVERY/…`).
4. Delete `services/mock/` once every service has been switched over.

## Razorpay

The payment flow lives in `hooks/useRazorpayPayment.ts`:
`paymentService.createRazorpayOrder` → `paymentService.openCheckout` → `paymentService.verifyPayment` → update the order.

The checkout UI comes from a gateway that is chosen by `VITE_PAYMENT_GATEWAY`:

- `mock` (default): `services/payment/mockRazorpayGateway.ts` opens an in-app dialog that can simulate success or failure.
- `razorpay`: `services/payment/razorpayGateway.ts` loads `checkout.js` and uses the real `handler` / `ondismiss` / `payment.failed` callbacks.

Both gateways implement the same `PaymentGateway` interface, so moving to production only means pointing the payment service methods at `/api/payments/razorpay/create-order` and `/verify`.

To reset the mock data, clear the `easybuy-mock-db-v1` key from localStorage.
