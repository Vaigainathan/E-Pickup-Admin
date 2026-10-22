export const MARKETPLACE_ORDER_STATUSES = [
  'awaiting_payment',
  'payment_unconfirmed',
  'payment_review',
  'preparing',
  'ready',
  'handed_over',
  'completed',
  'cancelled',
  'delivery_failed',
] as const

export const SHOP_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const

export const MARKETPLACE_HELP_STATUSES = ['open', 'reviewing', 'resolved'] as const

export const SHOP_REJECT_SECTIONS = ['business-details', 'documents', 'bank-details'] as const

export const MARKETPLACE_ORDER_CATEGORY = 'marketplace_order'
