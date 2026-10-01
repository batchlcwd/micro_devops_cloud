# EasyBuy Frontend

Storefront and admin dashboard for the EasyBuy microservices. Built with React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), Zustand, React Router and Lucide icons. Every screen calls the real Spring Boot APIs through the API gateway. Light, dark and system themes are supported (toggle in the header).

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:5173  (backend gateway must be running on :8080)
npm run build      # type-check + production build
```

## How it talks to the backend

```
browser ──/gw/*──▶ Vite dev proxy ──▶ API gateway :8080 ──▶ microservices (via Eureka)
```

- **Proxy:** the gateway has no CORS configuration, so in development the browser calls `/gw/...` and Vite forwards it to `GATEWAY_URL`. For a production build on another origin, set `VITE_API_BASE_URL` to the gateway URL and enable CORS on the gateway.
- **Service prefixes:** gateway routes are prefixed by service (`RouteConfig.java`), and `src/lib/http.ts` exposes one client per route:

  | Client | Gateway prefix | Service |
  | --- | --- | --- |
  | `api.products` | `/products/api` | products-service |
  | `api.cartOrders` | `/cart-orders/api` | cart-order-service |
  | `api.users` | `/users/api` | users-service |
  | `api.inventories` | `/inventories/api` | inventory-service |
  | `api.payments` | `/payments/api` | payment-service |

- **Auth:** `POST /users/api/users/login` returns `accessToken`, `refreshToken` and `user`. The access token is sent as `Bearer`. On a 401 the client calls `/users/api/users/refresh` once and retries; if that fails the user is signed out.

## Backend behaviour the UI accounts for

These come from reading the service code. The `docs/finalwork` guides differ in places.

- **userId in paths:** the gateway compares `{userId}` in `/carts/{userId}` and `/orders/{userId}/checkout` with the JWT `userId` claim, which is the user's UUID. The docs' email examples would get a 403.
- **Order statuses** are `CONFIRMED → IN_PROGRESS → DISPATCHED → OUT_OF_DELIVERY → DELIVERED`, plus `CANCELLED`. There is no `PENDING` or `SHIPPED`. Payment statuses are `PENDING / PAID / FAILED`.
- **Customer order details** come from `GET /orders/user/{userId}`. The gateway returns 403 to non-admins for `GET /orders/{orderId}` and `DELETE /orders/{orderId}`, because its ownership check reads the order id as a user id. Customers therefore can't cancel orders from the UI.
- **Cart:** guest carts live in localStorage. When a user signs in, the guest items are pushed into the server cart (`/carts/{userId}`), which is the source of truth from then on. Checkout reads the server cart.
- **Totals:** order totals are the sum of discounted line totals. There is no delivery fee, and the UI shows the same amount.
- **Stock visibility:** inventory reads need a token, so signed-out shoppers see "Sign in to check availability".
- **Stock records:** `inventory-service` does not create stock records for new products. *Admin → Products → Add product* creates the product and its inventory record. *Admin → Inventory* lists products that have no record and lets you create one; checkout fails for those products until you do.
- **Catalogue queries:** products-service has separate `/filter` and `/search` endpoints and no sort parameter. The listing page loads `/filter?live=true&categoryId=` (all pages, cached for 30s) and does search, price filtering, sorting and pagination client-side. Move these into the request once the backend supports them together.
- **Payments (real Razorpay):** `POST /payments/razorpay/create-order` returns the Razorpay order id and key id. The UI then opens Razorpay's `checkout.js`, and `POST /payments/razorpay/verify` checks the signature server-side. Card and UPI details are entered only in Razorpay's frame. If an attempt fails, Razorpay keeps its modal open so the customer can retry; the UI reports a failure only when the modal is closed without a successful payment. If payment-service is still on dummy keys (it returns `order_MOCK_…` ids), the UI shows a clear "not configured" error instead of opening checkout. The order's `paymentStatus` updates asynchronously over Kafka, so the order page polls briefly.
- **New accounts** are always `GUEST`. To get an admin, change the role (`PUT /users/api/users/change-role`, which itself needs an admin) or update the database.

## Structure

```
src/
  lib/          http client (gateway, JWT, refresh) · tokenStorage · pricing · orderStatus · format
  services/     one module per backend service, each method annotated with its endpoint
  stores/       Zustand: auth · cart (guest/server) · product · inventory · order · mockRazorpay
  hooks/        useAsync · useAddToCart · useRazorpayPayment · useProductImages · …
  components/   ui/ (shadcn) · common/ · layout/ · product/ · checkout/ · order/ · admin/
  pages/        store/ · admin/ · Login · Register · NotFound
  data/         static reference data only (Indian states, category cover images)
  types/        types mirroring the Spring Boot DTOs
```
