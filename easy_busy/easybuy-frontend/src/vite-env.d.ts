/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCKS?: string
  readonly VITE_PAYMENT_GATEWAY?: 'mock' | 'razorpay'
  readonly VITE_RAZORPAY_KEY_ID?: string
}
