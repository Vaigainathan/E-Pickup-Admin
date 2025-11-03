import { io, Socket } from 'socket.io-client'
// import { WebSocketEvent } from '../types' // Removed unused import

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventListeners: Map<string, Function[]> = new Map()

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Basic token validation - don't reject on format issues, let server handle it
      if (!token || typeof token !== 'string') {
        reject(new Error('No token provided for WebSocket connection'))
        return
      }

      // Don't validate token expiration here - let the server handle it
      // This prevents connection failures due to client-side validation errors

      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
      
      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      })

      this.socket.on('connect', () => {
        console.log('🔌 Connected to WebSocket server')
        this.reconnectAttempts = 0
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        // Don't reject immediately - try to handle gracefully
        console.log('⚠️ WebSocket connection failed, will retry...')
        this.handleReconnect()
        resolve() // Resolve instead of reject to prevent app crashes
      })

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from WebSocket server:', reason)
        
        // Don't reconnect for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          console.log('🔌 Server/client initiated disconnect, not reconnecting')
          return
        }
        
        this.handleReconnect()
      })

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error)
        
        // Handle specific error types more gracefully
        if (error.message?.includes('Authentication failed')) {
          console.error('❌ Authentication failed, will retry connection...')
          // Don't redirect immediately - let the app handle it gracefully
          setTimeout(() => {
            this.handleReconnect()
          }, 5000) // Retry after 5 seconds
          return
        }
      })

      // Set up admin-specific event listeners
      this.setupAdminEventListeners()
    })
  }

  private setupAdminEventListeners() {
    if (!this.socket) return

    // Driver verification events
    this.socket.on('driver_verification_request', (data) => {
      this.emit('driver_verification_request', data)
    })

    this.socket.on('driver_verification_completed', (data) => {
      this.emit('driver_verification_completed', data)
    })

    // Booking events
    this.socket.on('booking_created', (data) => {
      this.emit('booking_created', data)
    })

    this.socket.on('booking_status_update', (data) => {
      this.emit('booking_status_update', data)
    })

    this.socket.on('booking_cancelled', (data) => {
      this.emit('booking_cancelled', data)
    })

    // Emergency events
    this.socket.on('emergency_alert', (data) => {
      this.emit('emergency_alert', data)
    })

    this.socket.on('emergency_response', (data) => {
      this.emit('emergency_response', data)
    })

    // Support events
    this.socket.on('support_ticket_created', (data) => {
      this.emit('support_ticket_created', data)
    })

    this.socket.on('support_ticket_updated', (data) => {
      this.emit('support_ticket_updated', data)
    })

    // System events
    this.socket.on('system_health_update', (data) => {
      this.emit('system_health_update', data)
    })

    this.socket.on('system_metrics_update', (data) => {
      this.emit('system_metrics_update', data)
    })

    // Driver location updates
    this.socket.on('driver_location_update', (data) => {
      this.emit('driver_location_update', data)
    })

    // User events
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data)
    })

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data)
    })

    // Payment events
    this.socket.on('payment_completed', (data) => {
      this.emit('payment_completed', data)
    })

    this.socket.on('payment_failed', (data) => {
      this.emit('payment_failed', data)
    })

    // ✅ CRITICAL FIX: Driver earnings update events
    this.socket.on('driver_earnings_updated', (data) => {
      console.log('💰 Driver earnings updated:', data)
      this.emit('driver_earnings_updated', data)
      // ✅ CRITICAL FIX: Dispatch window event for DriverManagement component
      window.dispatchEvent(new CustomEvent('driver_earnings_updated', { detail: data }))
    })

    // Booking deleted event
    this.socket.on('booking_deleted', (data) => {
      console.log('🗑️ Booking deleted:', data)
      this.emit('booking_deleted', data)
      // ✅ CRITICAL FIX: Dispatch window event for DriverManagement component
      window.dispatchEvent(new CustomEvent('booking_deleted', { detail: data }))
    })

    // ✅ CRITICAL FIX: Driver rating update events (driver isolated)
    this.socket.on('driver_rating_updated', (data) => {
      console.log('⭐ Driver rating updated:', data)
      this.emit('driver_rating_updated', data)
      // ✅ CRITICAL FIX: Dispatch window event for DriverManagement component
      window.dispatchEvent(new CustomEvent('driver_rating_updated', { detail: data }))
    })

    // Notification events
    this.socket.on('notification_sent', (data) => {
      this.emit('notification_sent', data)
    })

    // Admin events
    this.socket.on('admin_action', (data) => {
      this.emit('admin_action', data)
    })

    this.socket.on('admin_notification', (data) => {
      this.emit('admin_notification', data)
    })
  }

  private async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    // Validate token before reconnection
    try {
      const token = await this.getValidToken()
      if (!token) {
        console.error('❌ No valid token available for reconnection')
        return
      }
    } catch (error) {
      console.error('❌ Token validation failed during reconnection:', error)
      return
    }

    setTimeout(() => {
      if (this.socket) {
        this.socket.connect()
      }
    }, delay)
  }

  private async getValidToken(): Promise<string | null> {
    try {
      const { secureTokenStorage } = await import('./secureTokenStorage')
      const token = await secureTokenStorage.getToken()
      
      if (!token) return null
      
      // Validate token expiration
      if (!token || token.split('.').length !== 3) {
        return null
      }
      const tokenParts = token!.split('.')
      if (tokenParts.length < 2 || !tokenParts[1]) {
        return null
      }
      const tokenPayload = JSON.parse(atob(tokenParts[1]))
      if (tokenPayload.exp && tokenPayload.exp < Date.now() / 1000) {
        // Try to refresh token
        const { firebaseAuthService } = await import('./firebaseAuthService')
        const refreshedToken = await firebaseAuthService.getIdToken(true)
        return refreshedToken
      }
      
      return token
    } catch (error) {
      console.error('❌ Error getting valid token:', error)
      return null
    }
  }

  // Event subscription methods
  on(event: string, callback: Function) {
    // Validate event name
    if (!event || typeof event !== 'string' || event.length === 0) {
      console.error('❌ Invalid event name provided')
      return
    }

    // Validate callback
    if (typeof callback !== 'function') {
      console.error('❌ Invalid callback provided for event:', event)
      return
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          // Sanitize data before passing to callback
          const sanitizedData = this.sanitizeMessageData(data)
          callback(sanitizedData)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  private sanitizeMessageData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data
    }

    // Create a sanitized copy
    const sanitized = { ...data }

    // Remove potentially dangerous properties
    delete sanitized.__proto__
    delete sanitized.constructor
    delete sanitized.prototype

    // Sanitize string values
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        // Remove potential XSS vectors
        sanitized[key] = sanitized[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeMessageData(sanitized[key])
      }
    }

    return sanitized
  }

  // Admin action methods
  joinAdminRoom() {
    if (this.socket) {
      this.socket.emit('join_admin_room')
    }
  }

  leaveAdminRoom() {
    if (this.socket) {
      this.socket.emit('leave_admin_room')
    }
  }

  subscribeToDriverUpdates(driverId: string) {
    if (this.socket) {
      this.socket.emit('subscribe_driver', { driverId })
    }
  }

  unsubscribeFromDriverUpdates(driverId: string) {
    if (this.socket) {
      this.socket.emit('unsubscribe_driver', { driverId })
    }
  }

  subscribeToBookingUpdates(bookingId: string) {
    if (this.socket) {
      this.socket.emit('subscribe_booking', { bookingId })
    }
  }

  unsubscribeFromBookingUpdates(bookingId: string) {
    if (this.socket) {
      this.socket.emit('unsubscribe_booking', { bookingId })
    }
  }

  subscribeToEmergencyUpdates() {
    if (this.socket) {
      this.socket.emit('subscribe_emergency')
    }
  }

  unsubscribeFromEmergencyUpdates() {
    if (this.socket) {
      this.socket.emit('unsubscribe_emergency')
    }
  }

  subscribeToSystemUpdates() {
    if (this.socket) {
      this.socket.emit('subscribe_system')
    }
  }

  unsubscribeFromSystemUpdates() {
    if (this.socket) {
      this.socket.emit('unsubscribe_system')
    }
  }

  // Admin broadcast methods
  broadcastToDrivers(message: string, driverIds?: string[]) {
    if (this.socket) {
      this.socket.emit('admin_broadcast_drivers', { message, driverIds })
    }
  }

  broadcastToCustomers(message: string, customerIds?: string[]) {
    if (this.socket) {
      this.socket.emit('admin_broadcast_customers', { message, customerIds })
    }
  }

  sendEmergencyResponse(alertId: string, response: any) {
    if (this.socket) {
      this.socket.emit('admin_emergency_response', { alertId, response })
    }
  }

  sendSystemAlert(alert: any) {
    if (this.socket) {
      this.socket.emit('admin_system_alert', alert)
    }
  }

  // Connection status
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected'
    return this.socket.connected ? 'connected' : 'disconnected'
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.eventListeners.clear()
    this.reconnectAttempts = 0
  }

  // Get socket instance for direct access if needed
  getSocket(): Socket | null {
    return this.socket
  }
}

export const websocketService = new WebSocketService()
export default websocketService
