/**
 * Live Tracking Service for Admin Dashboard
 * Handles real-time tracking data and driver monitoring
 */

import { secureTokenStorage } from './secureTokenStorage';

interface TrackingData {
  bookingId: string;
  driverId: string;
  customerId: string;
  isActive: boolean;
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  } | null;
  locationHistory: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
  startTime: string;
  lastUpdate: string;
}

interface DriverLocation {
  driverId: string;
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  } | null;
  lastUpdated: string;
}

interface BookingWithTracking {
  id: string;
  customerId: string;
  driverId: string;
  status: string;
  pickup: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  dropoff: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  fare: {
    total: number;
  };
  createdAt: string;
  driverInfo?: {
    name: string;
    phone: string;
    vehicleNumber: string;
  };
  customerInfo?: {
    name: string;
    phone: string;
  };
  trackingData?: TrackingData;
}

class LiveTrackingService {
  private baseUrl: string;
  private refreshInterval: number = 10000; // 10 seconds
  private activeInterval: any = null;
  private callbacks: {
    onBookingsUpdate?: (bookings: BookingWithTracking[]) => void;
    onDriversUpdate?: (drivers: DriverLocation[]) => void;
    onError?: (error: string) => void;
  } = {};

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  /**
   * Set up event callbacks
   */
  onBookingsUpdate(callback: (bookings: BookingWithTracking[]) => void) {
    this.callbacks.onBookingsUpdate = callback;
  }

  onDriversUpdate(callback: (drivers: DriverLocation[]) => void) {
    this.callbacks.onDriversUpdate = callback;
  }

  onError(callback: (error: string) => void) {
    this.callbacks.onError = callback;
  }

  /**
   * Start live tracking updates
   */
  startLiveTracking() {
    if (this.activeInterval) {
      clearInterval(this.activeInterval);
    }

    // Initial load
    this.loadTrackingData();

    // Set up interval
    this.activeInterval = setInterval(() => {
      this.loadTrackingData();
    }, this.refreshInterval);

    console.log('🔄 [LIVE_TRACKING] Started live tracking updates');
  }

  /**
   * Stop live tracking updates
   */
  stopLiveTracking() {
    if (this.activeInterval) {
      clearInterval(this.activeInterval);
      this.activeInterval = null;
    }
    console.log('🛑 [LIVE_TRACKING] Stopped live tracking updates');
  }

  /**
   * Load tracking data
   */
  private async loadTrackingData() {
    try {
      await Promise.all([
        this.loadActiveBookings(),
        this.loadOnlineDrivers()
      ]);
    } catch (error) {
      console.error('❌ [LIVE_TRACKING] Error loading tracking data:', error);
      this.callbacks.onError?.(error instanceof Error ? error.message : 'Failed to load tracking data');
    }
  }

  /**
   * Load active bookings with tracking data
   */
  private async loadActiveBookings() {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/bookings?status=active&includeTracking=true`, {
        headers: {
          'Authorization': `Bearer ${await secureTokenStorage.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        this.callbacks.onBookingsUpdate?.(data.data.bookings || []);
      } else {
        throw new Error(data.error || 'Failed to load bookings');
      }
    } catch (error) {
      console.error('❌ [LIVE_TRACKING] Error loading active bookings:', error);
      this.callbacks.onError?.(error instanceof Error ? error.message : 'Failed to load active bookings');
    }
  }

  /**
   * Load online drivers with location data
   */
  private async loadOnlineDrivers() {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/drivers?status=online&includeLocation=true`, {
        headers: {
          'Authorization': `Bearer ${await secureTokenStorage.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        this.callbacks.onDriversUpdate?.(data.data.drivers || []);
      } else {
        throw new Error(data.error || 'Failed to load drivers');
      }
    } catch (error) {
      console.error('❌ [LIVE_TRACKING] Error loading online drivers:', error);
      this.callbacks.onError?.(error instanceof Error ? error.message : 'Failed to load online drivers');
    }
  }

  /**
   * Get tracking data for a specific booking
   */
  async getBookingTracking(bookingId: string): Promise<{ success: boolean; data?: TrackingData; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/location-tracking/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${await secureTokenStorage.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error || 'Failed to get tracking data' };
      }
    } catch (error) {
      console.error('❌ [LIVE_TRACKING] Error getting booking tracking:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get tracking data' };
    }
  }

  /**
   * Get location history for a booking
   */
  async getLocationHistory(bookingId: string, limit: number = 50): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/location-tracking/${bookingId}/history?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${await secureTokenStorage.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error || 'Failed to get location history' };
      }
    } catch (error) {
      console.error('❌ [LIVE_TRACKING] Error getting location history:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get location history' };
    }
  }

  /**
   * Stop tracking for a booking
   */
  async stopTracking(bookingId: string, reason: string = 'admin_stopped'): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/location-tracking/${bookingId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await secureTokenStorage.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to stop tracking' };
      }
    } catch (error) {
      console.error('❌ [LIVE_TRACKING] Error stopping tracking:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to stop tracking' };
    }
  }

  /**
   * Get tracking statistics
   */
  async getTrackingStatistics(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/location-tracking/statistics`, {
        headers: {
          'Authorization': `Bearer ${await secureTokenStorage.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error || 'Failed to get tracking statistics' };
      }
    } catch (error) {
      console.error('❌ [LIVE_TRACKING] Error getting tracking statistics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get tracking statistics' };
    }
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate ETA between two points
   */
  calculateETA(currentLat: number, currentLon: number, destLat: number, destLon: number): string {
    const distance = this.calculateDistance(currentLat, currentLon, destLat, destLon);
    const averageSpeed = 30; // km/h
    const etaMinutes = Math.round((distance / averageSpeed) * 60);
    
    if (etaMinutes < 60) {
      return `${etaMinutes} mins`;
    } else {
      const hours = Math.floor(etaMinutes / 60);
      const minutes = etaMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Get driver status color
   */
  getDriverStatusColor(isOnline: boolean, isAvailable: boolean): string {
    if (!isOnline) return '#6C757D';
    if (isAvailable) return '#28A745';
    return '#FF6347';
  }

  /**
   * Get booking status color
   */
  getBookingStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'accepted': return '#007AFF';
      case 'driver_enroute': return '#32CD32';
      case 'picked_up': return '#FF6347';
      case 'delivered': return '#28A745';
      case 'cancelled': return '#DC3545';
      default: return '#6C757D';
    }
  }

  /**
   * Get live bookings (public method)
   */
  async getLiveBookings(): Promise<{ success: boolean; data?: BookingWithTracking[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/bookings?status=active&includeTracking=true`, {
        headers: {
          'Authorization': `Bearer ${await secureTokenStorage.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return { success: true, data: data.data.bookings || [] };
      } else {
        return { success: false, error: data.error || 'Failed to load bookings' };
      }
    } catch (error) {
      console.error('❌ [LIVE_TRACKING] Error getting live bookings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load bookings' };
    }
  }

  /**
   * Get online drivers (public method)
   */
  async getOnlineDrivers(): Promise<{ success: boolean; data?: DriverLocation[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/available-drivers`, {
        headers: {
          'Authorization': `Bearer ${await secureTokenStorage.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return { success: true, data: data.data.drivers || [] };
      } else {
        return { success: false, error: data.error || 'Failed to load drivers' };
      }
    } catch (error) {
      console.error('❌ [LIVE_TRACKING] Error getting online drivers:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load drivers' };
    }
  }

  /**
   * Simulate websocket event for a booking (admin-only)
   */
  async simulateEvent(params: {
    bookingId: string;
    event: 'booking_status_update' | 'driver-location-update';
    driverId?: string;
    payload?: any;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/realtime/test/simulate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await secureTokenStorage.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: !!data.success };
    } catch (error) {
      console.error('❌ [LIVE_TRACKING] Error simulating event:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to simulate event' };
    }
  }

  /**
   * Cleanup service
   */
  cleanup() {
    this.stopLiveTracking();
    this.callbacks = {};
  }
}

export const liveTrackingService = new LiveTrackingService();
export default liveTrackingService;
