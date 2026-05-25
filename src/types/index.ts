// User and Authentication Types
export interface User {
  uid: string
  id: string // Alias for uid for backward compatibility
  email: string | null
  name: string | null // Alias for displayName for backward compatibility
  displayName: string | null
  role: 'super_admin' | 'pending'
  idToken?: string
  refreshToken?: string
  lastLogin?: string
  createdAt?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

// Driver Types
export interface Driver {
  id: string
  uid?: string
  driverId?: string
  name?: string // Legacy field
  email?: string // Legacy field
  phone?: string // Legacy field
  personalInfo?: {
    name: string
    email: string
    phone: string
    dateOfBirth?: string
    address?: string
  }
  vehicleInfo?: {
    make: string
    model: string
    year: number
    color: string
    plateNumber: string
  }
  vehicle?: {
    make: string
    model: string
    year: number
    color: string
    plateNumber: string
  }
  vehicleDetails?: {
    vehicleType: 'motorcycle' | 'electric' | string
    vehicleNumber: string
    vehicleModel: string
    licenseNumber: string
    licenseExpiry: string
  }
  documents?: {
    drivingLicense?: DocumentInfo
    aadhaarCard?: DocumentInfo
    bikeInsurance?: DocumentInfo
    rcBook?: DocumentInfo
    profilePhoto?: DocumentInfo
  }
  driver?: {
    verificationStatus?: string
    isVerified?: boolean
    documents?: Driver['documents']
    vehicleDetails?: Driver['vehicleDetails']
  }
  location?: {
    latitude: number
    longitude: number
    address: string
    timestamp: string
  }
  isOnline?: boolean
  isAvailable?: boolean
  isActive?: boolean
  rating: number
  totalDeliveries?: number
  totalTrips?: number
  earnings?: {
    total: number
    thisMonth: number
    lastMonth: number
    commission?: number
  }
  wallet?: {
    balance: number
    totalEarned?: number
    totalSpent?: number
    requiresTopUp?: boolean
    canWork?: boolean
    lastUpdated?: string
  }
  status: 'pending' | 'verified' | 'rejected' | 'suspended' | 'blocked' | 'active' | 'not_uploaded' | 'pending_verification' | string
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'not_uploaded' | 'pending_verification' | string
  isVerified?: boolean
  createdAt: string
  updatedAt?: string
}

export interface DocumentInfo {
  url: string
  status: 'pending' | 'verified' | 'rejected'
  uploadedAt: string
  verifiedAt?: string
  verifiedBy?: string
  rejectionReason?: string
  verified?: boolean
}

// Customer Types
export interface Customer {
  id: string
  name?: string
  email?: string
  phone?: string
  personalInfo?: {
    name: string
    email: string
    phone: string
    dateOfBirth?: string
    address?: string
  }
  accountStatus?: 'active' | 'suspended' | 'banned'
  createdAt?: Date
  updatedAt?: Date
  bookingsCount?: number
  wallet?: {
    balance: number
    transactions: any[]
  }
}

// Booking Types
export interface Booking {
  id: string
  bookingId?: string // Alternative ID field
  customerId: string
  driverId?: string
  customerInfo?: {
    name: string
    phone: string
    email: string
  }
  customerName?: string // Legacy field
  customerPhone?: string // Legacy field
  customerEmail?: string // Legacy field
  driverInfo?: {
    name: string
    phone: string
    rating: number
    verified?: boolean
  }
  driverName?: string // Legacy field
  driverVerified?: boolean
  // Location structures - support both formats
  pickup?: {
    name: string
    phone: string
    address: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  pickupLocation?: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
    latitude?: number
    longitude?: number
  }
  pickupAddress?: string // Legacy field
  dropoff?: {
    name: string
    phone: string
    address: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  dropoffLocation?: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
    latitude?: number
    longitude?: number
  }
  dropoffAddress?: string // Legacy field
  package?: {
    type: string
    weight: number
    dimensions: {
      length: number
      width: number
      height: number
    }
    description: string
    value: number
  }
  packageDetails?: {
    weight: number
    description: string
    value: number
    type?: string
  }
  status: 'pending' | 'driver_assigned' | 'accepted' | 'driver_enroute' | 
          'driver_arrived' | 'picked_up' | 'in_transit' | 'delivered' | 
          'completed' | 'cancelled' | 'rejected' | 'in_progress'
  pricing?: {
    baseFare: number
    distanceFare: number
    timeFare: number
    totalFare: number
    currency: string
  }
  // Legacy fare structure for backward compatibility
  fare?: {
    total: number
    base: number
    distance: number
    time: number
    totalFare?: number
    baseFare?: number
    distanceFare?: number
    currency?: string
  }
  // Direct fare fields
  totalFare?: number
  distance?: number
  estimatedTime?: number
  vehicleType?: string
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded' | string
  estimatedDuration?: number
  actualDuration?: number
  createdAt: string
  updatedAt: string
  scheduledAt?: string
  completedAt?: string
  // Contact information
  senderInfo?: {
    name: string
    phone: string
  }
  recipientInfo?: {
    name: string
    phone: string
  }
  // Cancellation details
  cancellation?: {
    reason: string
    reasonText?: string
    cancelledAt: string
    cancelledBy: 'driver' | 'customer' | 'admin'
    cancelledAtStage?: string
    evidencePhotos?: Array<{
      photoId: string
      photoUrl: string
      uploadedAt: string
      description?: string
    }>
  }
  // Photo verifications
  pickupVerification?: VerificationDetail
  deliveryVerification?: VerificationDetail
  // Intervention history (for admin)
  interventionHistory?: Array<{
    id: string
    action: string
    reason?: string
    performedBy: string
    performedAt: string
  }>
}

export interface VerificationDetail {
  photoUrl?: string
  rawPhotoUrl?: string
  storagePath?: string
  storageBucket?: string
  source?: string
  signedUrlExpiresAt?: string | null
  signedUrlError?: string | null
  verifiedAt?: string
  verifiedBy?: string | null
  location?: {
    latitude: number
    longitude: number
  }
  notes?: string | null
}

// Emergency Types
export interface EmergencyAlert {
  id: string
  alertId: string
  userId: string
  userType: 'customer' | 'driver'
  userInfo: {
    name: string
    phone: string
  }
  type: 'sos' | 'accident' | 'harassment' | 'medical' | 'other'
  priority: 'low' | 'medium' | 'high' | 'critical'
  location: {
    address: string
    latitude: number
    longitude: number
  }
  description: string
  status: 'active' | 'responded' | 'resolved' | 'false_alarm'
  bookingId?: string
  response?: {
    responderId: string
    responderName: string
    responseTime: number
    actions: string[]
    notes: string
  }
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

// Support Types
export interface SupportTicket {
  id: string
  ticketId: string
  userId: string
  userType: 'customer' | 'driver'
  userInfo?: {
    name: string
    email: string
    phone: string
  }
  subject: string
  description: string
  category: 'technical' | 'billing' | 'general' | 'complaint' | 'suggestion'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assignedTo?: string
  messages?: SupportMessage[]
  resolutionNotes?: string
  resolvedBy?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface SupportMessage {
  id: string
  senderId: string
  senderType: 'user' | 'admin'
  senderName: string
  message: string
  attachments?: string[]
  timestamp: string
}

// System Monitoring Types
export interface SystemMetrics {
  status: string
  uptime: number
  memory?: any
  timestamp: string
  services?: ServiceStatus[]
  metrics?: {
    totalUsers: number
    totalDrivers: number
    totalCustomers: number
    activeBookings: number
    pendingVerifications: number
    openSupportTickets: number
    activeEmergencyAlerts: number
  }
  systemMetrics?: {
    timestamp: string
    server: {
      cpu: number
      memory: number
      disk: number
      uptime: number
    }
    database: {
      connections: number
      responseTime: number
      queries: number
    }
    api: {
      requests: number
      responseTime: number
      errorRate: number
    }
    websocket: {
      connections: number
      messages: number
    }
    users: {
      online: number
      active: number
    }
  }
}

// Analytics Types
export interface AnalyticsData {
  period: string
  dateRange: {
    start: string
    end: string
  }
  users: {
    total: number
    drivers: number
    customers: number
    growth: number
  }
  bookings: {
    total: number
    completed: number
    active: number
    completionRate: string
  }
  revenue: {
    total: number
    averagePerBooking: string
    driverEarnings: number
    platformCommission: number
  }
  trends: {
    bookings: TimeSeriesData[]
    revenue: TimeSeriesData[]
    drivers: TimeSeriesData[]
  }
}

export interface TimeSeriesData {
  date: string
  value: number
}

// WebSocket Event Types
export interface WebSocketEvent {
  type: string
  data: any
  timestamp: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

// Filter and Pagination Types
export interface PaginationParams {
  page: number
  limit: number
  offset: number
  total?: number
  totalPages?: number
}

export interface FilterParams {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: any
}

export interface SortParams {
  field: string
  direction: 'asc' | 'desc'
}

// System Health Types
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'warning' | 'critical' | string
  services?: {
    api?: boolean
    database?: boolean
    websocket?: boolean
    firebase?: boolean
    [key: string]: boolean | undefined
  }
  servicesList?: ServiceStatus[]
  uptime: number
  lastCheck?: string
  timestamp?: string
}

export interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'warning' | 'critical' | string
  responseTime?: number
  lastCheck?: string
  error?: string
}

// Work Slots Types
export interface WorkSlot {
  id: string
  driverId: string
  startTime: string | Date
  endTime: string | Date
  date?: string | Date | null
  label?: string
  slotId?: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  isSelected?: boolean
  selectedAt?: string | Date | null
  preservedFromDate?: string | Date | null
  location?: {
    address: string
    latitude: number
    longitude: number
  }
  shiftType?: string
  notes?: string
  createdAt: string
  updatedAt?: string
  bookingSummary?: {
    totalBookings: number
    completedBookings: number
    activeBookings: number
    cancelledBookings: number
    sampleBookings: Array<{
      id: string
      status: string
      customerName: string
      referenceTime?: string | null
      createdAt?: string | null
      updatedAt?: string | null
    }>
  }
}

// Rejection History Types
export interface DriverRejectionHistory {
  id: string
  driverId: string
  reason: string
  reasonCode?: string
  reasonText?: string
  rejectedBy: 'admin' | 'system'
  rejectedById?: string
  rejectedByName?: string
  rejectedAt: string
  bookingId?: string
  notes?: string
}

// Backup Types
export interface SystemBackup {
  id: string
  backupId: string
  createdAt: string
  size: number
  status: 'completed' | 'in_progress' | 'failed'
  createdBy: string
  createdByName?: string
  description?: string
  downloadUrl?: string
  expiresAt?: string
}

// Intervention Types
export interface BookingIntervention {
  id: string
  bookingId: string
  action: 'reassign_driver' | 'cancel_booking' | 'update_fare' | 'send_notification'
  reason: string
  performedBy: string
  performedByName?: string
  performedAt: string
  details?: {
    newDriverId?: string
    newFare?: number
    notificationMessage?: string
  }
  result?: {
    success: boolean
    message: string
  }
}