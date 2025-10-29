import { io, Socket } from 'socket.io-client'

interface RealTimeEventHandlers {
  onDriverUpdate?: (driver: any) => void
  onBookingUpdate?: (booking: any) => void
  onEmergencyAlert?: (alert: any) => void
  onSystemHealthUpdate?: (health: any) => void
  onNotification?: (notification: any) => void
  onConnectionStatusChange?: (connected: boolean) => void
  onLocationUpdate?: (location: any) => void
  onChatMessage?: (message: any) => void
  onDriverStatusChange?: (status: any) => void
  onBookingStatusChange?: (status: any) => void
  onETAUpdate?: (eta: any) => void
  onSupportTicket?: (ticket: any) => void
}

class RealTimeService {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventHandlers: RealTimeEventHandlers = {}
  private token: string | null = null

  constructor() {
    // Get token from secure storage
    try {
      const { secureTokenStorage } = require('./secureTokenStorage')
      this.token = secureTokenStorage.getToken()
    } catch (error) {
      console.error('❌ Error getting token from secure storage:', error)
      this.token = null
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        console.log('🔌 WebSocket already connected')
        resolve()
        return
      }

      // Check if we have a valid token
      if (!this.token || this.token.length < 10) {
        console.log('⚠️ No valid token available for WebSocket connection')
        reject(new Error('No valid authentication token available'))
        return
      }

      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://epickupbackend-production.up.railway.app'
      
      console.log('🔌 Connecting to WebSocket...', socketUrl)
      console.log('🔑 Token available:', this.token ? 'Yes' : 'No')

      this.socket = io(socketUrl, {
        auth: {
          token: this.token,
          userType: 'admin'
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      })

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected successfully')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.eventHandlers.onConnectionStatusChange?.(true)
        resolve()
      })

      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason)
        this.isConnected = false
        this.eventHandlers.onConnectionStatusChange?.(false)
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.handleReconnect()
        }
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error)
        this.isConnected = false
        this.eventHandlers.onConnectionStatusChange?.(false)
        this.handleReconnect()
        reject(error)
      })

      // Admin-specific event handlers
      this.setupAdminEventHandlers()

      // Set connection timeout
      setTimeout(() => {
        if (!this.isConnected) {
          console.error('❌ WebSocket connection timeout')
          reject(new Error('Connection timeout'))
        }
      }, 10000)
    })
  }

  private setupAdminEventHandlers(): void {
    if (!this.socket) return

    // Driver events
    this.socket.on('driver_verification_request', (data) => {
      console.log('📋 New driver verification request:', data)
      this.eventHandlers.onDriverUpdate?.(data)
    })

    this.socket.on('driver_status_update', (data) => {
      console.log('👤 Driver status updated:', data)
      this.eventHandlers.onDriverUpdate?.(data)
      this.eventHandlers.onDriverStatusChange?.(data)
    })

    // Location tracking events
    this.socket.on('location_update', (data) => {
      console.log('📍 Location update received:', data)
      this.eventHandlers.onLocationUpdate?.(data)
    })

    // Chat message events
    this.socket.on('chat_message', (data) => {
      console.log('💬 Chat message received:', data)
      this.eventHandlers.onChatMessage?.(data)
    })

    // Booking status events
    this.socket.on('booking_status_update', (data) => {
      console.log('📊 Booking status update:', data)
      this.eventHandlers.onBookingUpdate?.(data)
      this.eventHandlers.onBookingStatusChange?.(data)
    })

    // ETA update events
    this.socket.on('eta_updated', (data) => {
      console.log('⏰ ETA updated:', data)
      this.eventHandlers.onETAUpdate?.(data)
    })

    // Support ticket events
    this.socket.on('support_ticket_created', (data) => {
      console.log('🆘 Support ticket created:', data)
      this.eventHandlers.onSupportTicket?.(data)
    })

    this.socket.on('support_ticket_updated', (data) => {
      console.log('🆘 Support ticket updated:', data)
      this.eventHandlers.onSupportTicket?.(data)
    })

    this.socket.on('driver_location_update', (data) => {
      console.log('📍 Driver location updated:', data)
      this.eventHandlers.onDriverUpdate?.(data)
    })

    // Booking events
    this.socket.on('booking_created', (data) => {
      console.log('📦 New booking created:', data)
      this.eventHandlers.onBookingUpdate?.(data)
    })

    this.socket.on('booking_status_update', (data) => {
      console.log('📦 Booking status updated:', data)
      this.eventHandlers.onBookingUpdate?.(data)
    })

    this.socket.on('booking_cancelled', (data) => {
      console.log('❌ Booking cancelled:', data)
      this.eventHandlers.onBookingUpdate?.(data)
    })

    // Emergency events
    this.socket.on('emergency_alert', (data) => {
      console.log('🚨 Emergency alert received:', data)
      this.eventHandlers.onEmergencyAlert?.(data)
    })

    this.socket.on('emergency_resolved', (data) => {
      console.log('✅ Emergency resolved:', data)
      this.eventHandlers.onEmergencyAlert?.(data)
    })

    // ✅ CRITICAL FIX: Payment completion events
    this.socket.on('payment_completed', (data) => {
      console.log('💰 Payment completed:', data)
      this.eventHandlers.onPaymentCompleted?.(data)
    })

    // ✅ CRITICAL FIX: Delivery completion events
    this.socket.on('delivery_completed', (data) => {
      console.log('📦 Delivery completed:', data)
      this.eventHandlers.onDeliveryCompleted?.(data)
    })

    // System events
    this.socket.on('system_health_update', (data) => {
      console.log('💚 System health updated:', data)
      this.eventHandlers.onSystemHealthUpdate?.(data)
    })

    this.socket.on('system_metrics_update', (data) => {
      console.log('📊 System metrics updated:', data)
      this.eventHandlers.onSystemHealthUpdate?.(data)
    })

    // Notification events
    this.socket.on('admin_notification', (data) => {
      console.log('🔔 Admin notification received:', data)
      this.eventHandlers.onNotification?.(data)
    })

    // General events
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error)
    })
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('❌ Reconnection failed:', error)
      })
    }, delay)
  }

  setEventHandlers(handlers: RealTimeEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      console.log(`📤 Emitting event: ${event}`, data)
      this.socket.emit(event, data)
    } else {
      console.warn('⚠️ Cannot emit event - WebSocket not connected')
    }
  }

  joinRoom(room: string): void {
    if (!room || typeof room !== 'string' || room.trim() === '') {
      console.warn('⚠️ Cannot join room - Invalid room name:', room)
      return
    }
    
    if (this.socket?.connected) {
      console.log(`🚪 Joining room: ${room}`)
      this.socket.emit('join_room', { room })
    } else {
      console.warn('⚠️ Cannot join room - WebSocket not connected')
    }
  }

  leaveRoom(room: string): void {
    if (this.socket?.connected) {
      console.log(`🚪 Leaving room: ${room}`)
      this.socket.emit('leave_room', { room })
    } else {
      console.warn('⚠️ Cannot leave room - WebSocket not connected')
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...')
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.eventHandlers.onConnectionStatusChange?.(false)
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }

  updateToken(newToken: string): void {
    this.token = newToken
    
    // Update secure storage
    try {
      const { secureTokenStorage } = require('./secureTokenStorage')
      const user = secureTokenStorage.getCurrentUser()
      if (user) {
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        secureTokenStorage.setTokenData({
          token: newToken,
          expiresAt,
          user
        })
      }
    } catch (error) {
      console.error('❌ Error updating token in secure storage:', error)
    }
    
    // Reconnect with new token
    if (this.socket) {
      this.disconnect()
      this.connect()
    }
  }

  // Method to handle token refresh
  async refreshToken(): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://epickupbackend-production.up.railway.app'}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.token })
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      if (data.success && data.data?.accessToken) {
        this.updateToken(data.data.accessToken)
        console.log('✅ WebSocket token refreshed successfully')
      } else {
        throw new Error('Invalid refresh response')
      }
    } catch (error) {
      console.error('❌ WebSocket token refresh error:', error)
      throw error
    }
  }

  // Admin-specific methods
  subscribeToDriverUpdates(driverId?: string): void {
    if (driverId) {
      this.joinRoom(`driver_${driverId}`)
    } else {
      this.joinRoom('admin_drivers')
    }
  }

  subscribeToBookingUpdates(bookingId?: string): void {
    if (bookingId) {
      this.joinRoom(`booking_${bookingId}`)
    } else {
      this.joinRoom('admin_bookings')
    }
  }

  subscribeToEmergencyAlerts(): void {
    this.joinRoom('admin_emergency')
  }

  subscribeToSystemUpdates(): void {
    this.joinRoom('admin_system')
  }

  subscribeToLocationUpdates(driverId?: string): void {
    if (driverId) {
      this.joinRoom(`location_${driverId}`)
    } else {
      this.joinRoom('admin_locations')
    }
  }

  subscribeToChatMessages(bookingId?: string): void {
    if (bookingId) {
      this.joinRoom(`chat_${bookingId}`)
    } else {
      this.joinRoom('admin_chat')
    }
  }

  subscribeToSupportTickets(): void {
    this.joinRoom('admin_support')
  }

  subscribeToETAUpdates(): void {
    this.joinRoom('admin_eta')
  }

  unsubscribeFromAll(): void {
    this.emit('leave_all_rooms')
  }
}

export const realTimeService = new RealTimeService()
export default realTimeService
