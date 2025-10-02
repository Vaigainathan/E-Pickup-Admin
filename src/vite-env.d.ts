/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SOCKET_URL: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENVIRONMENT: string
  readonly VITE_ADMIN_EMAIL: string
  readonly VITE_ADMIN_PHONE: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_REAL_TIME: string
  readonly VITE_ENABLE_EMERGENCY_ALERTS: string
  readonly VITE_ENABLE_SYSTEM_MONITORING: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_LOG_LEVEL: string
  readonly DEV: boolean
}

// ImportMeta is already defined globally by Vite
