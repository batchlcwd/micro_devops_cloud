/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** Fallback only — payment-service normally returns the key id with each Razorpay order */
  readonly VITE_RAZORPAY_KEY_ID?: string
}
