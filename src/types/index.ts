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
  uid: string
  driverId: string
  personalInfo: {
    name: string
    email: string
    phone: string
    dateOfBirth: string
    address: string
  }
  vehicleInfo: {
    make: string
    model: string
    year: number
    color: string
    plateNumber: string
  }
  documents: {
    drivingLicense: DocumentInfo
    aadhaarCard: DocumentInfo
    bikeInsurance: DocumentInfo
    rcBook: DocumentInfo
    profilePhoto: DocumentInfo
  }
  location?: {
    latitude: number
    longitude: number
    address: string
    timestamp: string
  }
  isOnline: boolean
  isAvailable: boolean
  rating: number
  totalDeliveries: number
  earnings: {
    total: number
    thisMonth: number
    lastMonth: number
  }
  status: 'pending' | 'verified' | 'rejected' | 'suspended'
  isVerified?: boolean
  createdAt: string
  updatedAt: string
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
  bookingId: string
  customerId: string
  driverId?: string
  customerInfo: {
    name: string
    phone: string
    email: string
  }
  driverInfo?: {
    name: string
    phone: string
    rating: number
  }
  driverVerified?: boolean
  pickupLocation: {
    address: string
    latitude: number
    longitude: number
  }
  dropoffLocation: {
    address: string
    latitude: number
    longitude: number
  }
  packageDetails: {
    weight: number
    description: string
    value: number
  }
  status: 'pending' | 'confirmed' | 'driver_assigned' | 'driver_enroute' | 
          'driver_arrived' | 'picked_up' | 'in_transit' | 'at_dropoff' | 
          'delivered' | 'cancelled'
  fare: {
    baseFare: number
    distanceFare: number
    totalFare: number
    currency: string
  }
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  estimatedDuration?: number
  actualDuration?: number
  distance?: number
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
  userInfo: {
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
  messages: SupportMessage[]
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
  memory: any
  timestamp: string
  services: ServiceStatus[]
  metrics: {
    totalUsers: number
    totalDrivers: number
    totalCustomers: number
    activeBookings: number
    pendingVerifications: number
    openSupportTickets: number
    activeEmergencyAlerts: number
  }
  systemMetrics: {
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
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: ServiceStatus[]
  uptime: number
  lastCheck: string
}

export interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  lastCheck: string
  error?: string
}