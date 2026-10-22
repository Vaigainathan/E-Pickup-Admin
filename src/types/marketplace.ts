export interface ShopListItem {
  shopId: string
  shopName: string
  approvalStatus: string
  isActive: boolean
  upiVerified: boolean
  upiVerifiedName: string | null
  submitted: boolean
  createdAt?: unknown
  updatedAt?: unknown
}

export interface ShopListResponse {
  shops: ShopListItem[]
  pagination: { limit: number; offset: number; total: number }
}

export interface ShopDetail {
  shopId: string
  user?: Record<string, unknown>
  profile?: Record<string, unknown>
  upiVerified?: boolean
  onboardingStatus?: {
    rejectedSections?: string[]
    [key: string]: unknown
  }
}

export interface MarketplaceOrderSummary {
  orderId: string
  displayId?: string | null
  orderStatus?: string | null
  customerId?: string | null
  shopId?: string | null
  amount?: number | null
  customerUtrLast4?: string | null
  linkedBookingId?: string | null
  createdAt?: unknown
  updatedAt?: unknown
}

export interface MarketplaceOrderDetail {
  order: Record<string, unknown>
  summary: MarketplaceOrderSummary
  customer: { id: string; name?: string; phone?: string; email?: string } | null
  shop: { id: string; name?: string; phone?: string } | null
  events: Array<Record<string, unknown>>
  refunds: Array<Record<string, unknown> & { id: string }>
}

export interface MarketplaceHelpTicket {
  id: string
  category?: string
  status?: string
  orderId?: string
  displayId?: string
  problem?: string
  description?: string
  createdAt?: unknown
  updatedAt?: unknown
  [key: string]: unknown
}

export interface MarketplaceEnforcement {
  enforcement: { newStatuses: boolean; utrBlocksReject: boolean }
  updatedAt?: unknown
}

export interface CustomerMarketplaceRestriction {
  active: boolean
  reason: string | null
  setAt: string | Date | null
  setBy: string | null
}
