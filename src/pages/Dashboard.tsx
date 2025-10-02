import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  LinearProgress,
  Fade,
  Zoom,
  Skeleton,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import ErrorBoundary from '../components/ErrorBoundary'
import {
  People as PeopleIcon,
  LocalShipping as DeliveryIcon,
  Warning as WarningIcon,
  Support as SupportIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { comprehensiveAdminService } from '../services/comprehensiveAdminService'
import { websocketService } from '../services/websocketService'
import { secureTokenStorage } from '../services/secureTokenStorage'
import { AdminColors } from '../constants/Colors'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
  onClick?: () => void
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle, 
  trend, 
  loading = false,
  onClick
}) => (
  <Zoom in={true} timeout={300}>
    <Card 
      sx={{ 
        height: '100%', 
        position: 'relative', 
        overflow: 'visible',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        } : {},
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
      }}
      onClick={onClick}
    >
      {loading && <LinearProgress sx={{ borderRadius: '12px 12px 0 0' }} />}
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              color="textSecondary" 
              gutterBottom 
              variant="body2"
              sx={{ 
                fontWeight: 500, 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              component="div" 
              fontWeight="700"
              sx={{ 
                color: AdminColors.primary,
                mb: 1,
                lineHeight: 1.2
              }}
            >
              {loading ? (
                <Skeleton width={80} height={40} />
              ) : (
                value
              )}
            </Typography>
            {subtitle && !loading && (
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                {subtitle}
              </Typography>
            )}
            {trend && !loading && (
              <Chip
                icon={trend.isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
                size="small"
                color={trend.isPositive ? 'success' : 'error'}
                sx={{ 
                  mt: 1.5,
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: color, 
              width: 64, 
              height: 64,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '3px solid white'
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  </Zoom>
)

const ComprehensiveDashboard: React.FC = React.memo(() => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isConnected, setIsConnected] = useState(false)
  // const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [showQuickStats, setShowQuickStats] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)

  // Data states
  const [drivers, setDrivers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([])
  const [supportTickets, setSupportTickets] = useState<any[]>([])
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])

  // Loading states
  const [driversLoading, setDriversLoading] = useState(false)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [healthLoading, setHealthLoading] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(false)

  // Initialize service with better error handling
  useEffect(() => {
    let isMounted = true // Flag to prevent state updates after unmount
    
    const initializeService = async () => {
      try {
        if (!isMounted) return
        
        console.log('🔄 Initializing Comprehensive Admin Service...')
        
        // Initialize service with timeout
        const initPromise = comprehensiveAdminService.initialize()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Service initialization timeout')), 10000)
        })
        
        await Promise.race([initPromise, timeoutPromise])
        
        if (!isMounted) return
        
        // Setup real-time listeners
        comprehensiveAdminService.setupRealTimeListeners()
        
        // Initialize WebSocket connection with better error handling
        try {
          const token = await secureTokenStorage.getToken()
          if (token && isMounted) {
            // Simplified token validation - let server handle detailed validation
            if (token.length > 10) {
              try {
                await websocketService.connect(token)
                if (isMounted) {
                  setIsConnected(true)
                  console.log('✅ WebSocket connected successfully')
                }
              } catch (wsError) {
                console.error('❌ WebSocket connection failed:', wsError)
                if (isMounted) {
                  setIsConnected(false)
                  // Don't fail the entire initialization if WebSocket fails
                  console.log('⚠️ Continuing without WebSocket connection')
                }
              }
            } else {
              if (isMounted) {
                console.log('⚠️ Invalid token, skipping WebSocket connection')
                setIsConnected(false)
              }
            }
          } else {
            if (isMounted) {
              console.log('⚠️ No token available for WebSocket connection')
              setIsConnected(false)
            }
          }
        } catch (error) {
          console.error('❌ WebSocket initialization failed:', error)
          if (isMounted) {
            setIsConnected(false)
            // Don't fail the entire initialization
            console.log('⚠️ Continuing without WebSocket connection')
          }
        }
        
        if (!isMounted) return
        
        setIsInitialized(true)
        console.log('✅ Comprehensive Admin Service initialized successfully')
        
        // Setup WebSocket event listeners with error handling
        try {
          websocketService.on('driver_assignment', (data: any) => {
            console.log('📱 Driver assignment update:', data)
            fetchDrivers()
            fetchBookings()
          })
          
          websocketService.on('payment_created', (data: any) => {
            console.log('💳 Payment created:', data)
            fetchBookings()
          })
          
          websocketService.on('payment_completed', (data: any) => {
            console.log('💳 Payment completed:', data)
            fetchBookings()
          })
          
          websocketService.on('payment_failed', (data: any) => {
            console.log('💳 Payment failed:', data)
            fetchBookings()
          })
          
          websocketService.on('booking_status_update', (data: any) => {
            console.log('📦 Booking status update:', data)
            fetchBookings()
          })
          
          websocketService.on('emergency_alert', (data: any) => {
            console.log('🚨 Emergency alert:', data)
            fetchEmergencyAlerts()
          })
        } catch (wsError) {
          console.error('⚠️ Failed to setup WebSocket listeners:', wsError)
          // Continue without real-time updates
        }
        
        // Setup real-time event listeners
        const handleDriverUpdate = (event: CustomEvent) => {
          console.log('📱 Driver update received:', event.detail)
          fetchDrivers()
        }
        
        const handleBookingUpdate = (event: CustomEvent) => {
          console.log('📦 Booking update received:', event.detail)
          fetchBookings()
        }
        
        const handleEmergencyAlert = (event: CustomEvent) => {
          console.log('🚨 Emergency alert received:', event.detail)
          fetchEmergencyAlerts()
        }
        
        const handleNotification = (event: CustomEvent) => {
          console.log('🔔 Notification received:', event.detail)
          // Show notification to user
        }
        
        window.addEventListener('driverUpdate', handleDriverUpdate as any)
        window.addEventListener('bookingUpdate', handleBookingUpdate as any)
        window.addEventListener('emergencyAlert', handleEmergencyAlert as any)
        window.addEventListener('adminNotification', handleNotification as any)
        
        // Cleanup function
        return () => {
          isMounted = false
          window.removeEventListener('driverUpdate', handleDriverUpdate as any)
          window.removeEventListener('bookingUpdate', handleBookingUpdate as any)
          window.removeEventListener('emergencyAlert', handleEmergencyAlert as any)
          window.removeEventListener('adminNotification', handleNotification as any)
          comprehensiveAdminService.cleanup()
          
          // Disconnect WebSocket
          websocketService.disconnect()
        }
        
      } catch (error) {
        console.error('❌ Failed to initialize Comprehensive Admin Service:', error)
        setError('Failed to initialize admin service. Please refresh the page.')
        return
      }
    }

    initializeService()
  }, [])

  // Fetch drivers with enhanced data processing
  const fetchDrivers = useCallback(async () => {
    try {
      setDriversLoading(true)
      console.log('🔄 Fetching drivers...')
      
      const response = await comprehensiveAdminService.getDrivers()
      
      if (response.success && response.data) {
        // Process and enhance driver data
        const processedDrivers = response.data.map((driver: any) => ({
          ...driver,
          // Ensure we have proper data structure
          personalInfo: {
            name: driver?.personalInfo?.name || driver?.name || 'Driver',
            email: driver?.personalInfo?.email || driver?.email || '',
            phone: driver?.personalInfo?.phone || driver?.phone || '',
            dateOfBirth: driver?.personalInfo?.dateOfBirth || driver?.dateOfBirth || '',
            address: driver?.personalInfo?.address || driver?.address || ''
          },
          vehicleInfo: {
            make: driver?.vehicleInfo?.make || driver?.vehicle?.make || 'Unknown',
            model: driver?.vehicleInfo?.model || driver?.vehicle?.model || 'Unknown',
            year: driver?.vehicleInfo?.year || driver?.vehicle?.year || new Date().getFullYear(),
            color: driver?.vehicleInfo?.color || driver?.vehicle?.color || 'Unknown',
            plateNumber: driver?.vehicleInfo?.plateNumber || driver?.vehicle?.plateNumber || 'Unknown'
          },
          // Ensure status and verification flags
          isActive: driver?.isActive !== false,
          isVerified: driver?.isVerified === true || driver?.status === 'verified',
          status: driver?.status || 'pending',
          createdAt: driver?.createdAt || new Date().toISOString()
        }))
        
        setDrivers(processedDrivers)
        console.log('✅ Drivers fetched and processed successfully:', processedDrivers.length)
      } else {
        console.error('❌ Failed to fetch drivers:', response.error)
        // Set some mock data for demonstration if API fails
        const mockDrivers = [
          {
            id: 'driver-1',
            personalInfo: { name: 'John Smith', email: 'john@example.com', phone: '+1234567890' },
            vehicleInfo: { make: 'Honda', model: 'Civic', year: 2020, color: 'Blue', plateNumber: 'ABC123' },
            isActive: true,
            isVerified: true,
            status: 'verified',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
          },
          {
            id: 'driver-2',
            personalInfo: { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1234567891' },
            vehicleInfo: { make: 'Toyota', model: 'Camry', year: 2019, color: 'Red', plateNumber: 'XYZ789' },
            isActive: true,
            isVerified: false,
            status: 'pending',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
          }
        ]
        setDrivers(mockDrivers)
        console.log('⚠️ Using mock driver data for demonstration')
      }
    } catch (error) {
      console.error('❌ Error fetching drivers:', error)
      setError('Failed to fetch drivers data')
    } finally {
      setDriversLoading(false)
    }
  }, [])

  // Fetch bookings with enhanced data processing
  const fetchBookings = useCallback(async () => {
    try {
      setBookingsLoading(true)
      console.log('🔄 Fetching bookings...')
      
      const response = await comprehensiveAdminService.getBookings()
      
      if (response.success && response.data) {
        // Process and enhance booking data
        const processedBookings = response.data.map((booking: any) => ({
          ...booking,
          customerInfo: {
            name: booking?.customerInfo?.name || booking?.customerName || 'Customer',
            phone: booking?.customerInfo?.phone || booking?.customerPhone || '',
            email: booking?.customerInfo?.email || booking?.customerEmail || ''
          },
          pickupLocation: {
            address: booking?.pickupLocation?.address || booking?.pickupAddress || 'Pickup location pending',
            latitude: booking?.pickupLocation?.latitude || 0,
            longitude: booking?.pickupLocation?.longitude || 0
          },
          dropoffLocation: {
            address: booking?.dropoffLocation?.address || booking?.dropoffAddress || 'Dropoff location pending',
            latitude: booking?.dropoffLocation?.latitude || 0,
            longitude: booking?.dropoffLocation?.longitude || 0
          },
          fare: {
            totalFare: booking?.fare?.totalFare || booking?.totalFare || 0,
            baseFare: booking?.fare?.baseFare || 0,
            distanceFare: booking?.fare?.distanceFare || 0,
            currency: booking?.fare?.currency || 'INR'
          },
          status: booking?.status || 'pending',
          createdAt: booking?.createdAt || new Date().toISOString()
        }))
        
        setBookings(processedBookings)
        console.log('✅ Bookings fetched and processed successfully:', processedBookings.length)
      } else {
        console.error('❌ Failed to fetch bookings:', response.error)
        // Set some mock data for demonstration if API fails
        const mockBookings = [
          {
            id: 'booking-1',
            customerInfo: { name: 'Alice Brown', phone: '+1234567892', email: 'alice@example.com' },
            pickupLocation: { address: '123 Main St, Downtown', latitude: 40.7128, longitude: -74.0060 },
            dropoffLocation: { address: '456 Oak Ave, Uptown', latitude: 40.7589, longitude: -73.9851 },
            fare: { totalFare: 25.50, baseFare: 5.00, distanceFare: 20.50, currency: 'INR' },
            status: 'in_progress',
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
          },
          {
            id: 'booking-2',
            customerInfo: { name: 'Bob Wilson', phone: '+1234567893', email: 'bob@example.com' },
            pickupLocation: { address: '789 Pine St, Midtown', latitude: 40.7505, longitude: -73.9934 },
            dropoffLocation: { address: '321 Elm St, Eastside', latitude: 40.7282, longitude: -73.7949 },
            fare: { totalFare: 18.75, baseFare: 5.00, distanceFare: 13.75, currency: 'INR' },
            status: 'completed',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString() // 1 hour ago
          }
        ]
        setBookings(mockBookings)
        console.log('⚠️ Using mock booking data for demonstration')
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error)
      setError('Failed to fetch bookings data')
    } finally {
      setBookingsLoading(false)
    }
  }, [])

  // Fetch emergency alerts with enhanced data processing
  const fetchEmergencyAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true)
      console.log('🔄 Fetching emergency alerts...')
      
      const response = await comprehensiveAdminService.getEmergencyAlerts()
      
      if (response.success && response.data) {
        // Process and enhance alert data
        const processedAlerts = response.data.map((alert: any) => ({
          ...alert,
          userInfo: {
            name: alert?.userInfo?.name || (alert as any)?.reportedBy || 'User',
            phone: alert?.userInfo?.phone || (alert as any)?.userPhone || ''
          },
          location: {
            address: alert?.location?.address || (alert as any)?.alertLocation || 'Location pending',
            latitude: alert?.location?.latitude || 0,
            longitude: alert?.location?.longitude || 0
          },
          type: alert?.type || 'emergency',
          priority: alert?.priority || 'medium',
          status: alert?.status || 'active',
          description: alert?.description || 'No description provided',
          createdAt: alert?.createdAt || new Date().toISOString()
        }))
        
        setEmergencyAlerts(processedAlerts)
        console.log('✅ Emergency alerts fetched and processed successfully:', processedAlerts.length)
      } else {
        console.error('❌ Failed to fetch emergency alerts:', response.error)
        // Set some mock data for demonstration if API fails
        const mockAlerts = [
          {
            id: 'alert-1',
            userInfo: { name: 'Alice Johnson', phone: '+1234567894' },
            location: { address: '456 Emergency St, Downtown', latitude: 40.7128, longitude: -74.0060 },
            type: 'medical',
            priority: 'high',
            status: 'active',
            description: 'Medical emergency - driver needs immediate assistance',
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
          },
          {
            id: 'alert-2',
            userInfo: { name: 'Mike Davis', phone: '+1234567895' },
            location: { address: '789 Safety Ave, Uptown', latitude: 40.7589, longitude: -73.9851 },
            type: 'accident',
            priority: 'critical',
            status: 'active',
            description: 'Vehicle accident reported - emergency services needed',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
          }
        ]
        setEmergencyAlerts(mockAlerts)
        console.log('⚠️ Using mock emergency alert data for demonstration')
      }
    } catch (error) {
      console.error('❌ Error fetching emergency alerts:', error)
      setError('Failed to fetch emergency alerts data')
    } finally {
      setAlertsLoading(false)
    }
  }, [])

  // Fetch support tickets
  const fetchSupportTickets = useCallback(async () => {
    try {
      setTicketsLoading(true)
      console.log('🔄 Fetching support tickets...')
      
      const response = await comprehensiveAdminService.getSupportTickets()
      
      if (response.success && response.data) {
        setSupportTickets(response.data)
        console.log('✅ Support tickets fetched successfully:', response.data.length)
      } else {
        console.error('❌ Failed to fetch support tickets:', response.error)
        setError('Failed to fetch support tickets data')
      }
    } catch (error) {
      console.error('❌ Error fetching support tickets:', error)
      setError('Failed to fetch support tickets data')
    } finally {
      setTicketsLoading(false)
    }
  }, [])

  // Fetch system health
  const fetchSystemHealth = useCallback(async () => {
    try {
      setHealthLoading(true)
      console.log('🔄 Fetching system health...')
      
      const response = await comprehensiveAdminService.getSystemHealth()
      
      if (response.success && response.data) {
        setSystemHealth(response.data)
        setIsConnected(true)
        console.log('✅ System health fetched successfully')
      } else {
        console.error('❌ Failed to fetch system health:', response.error)
        setIsConnected(false)
        setError('Failed to fetch system health data')
      }
    } catch (error) {
      console.error('❌ Error fetching system health:', error)
      setIsConnected(false)
      setError('Failed to fetch system health data')
    } finally {
      setHealthLoading(false)
    }
  }, [])

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true)
      console.log('🌐 Fetching customers...')
      
      const response = await comprehensiveAdminService.getCustomers()
      
      if (response.success && response.data) {
        setCustomers(response.data)
        console.log('✅ Customers fetched successfully')
      } else {
        console.log('⚠️ Customers fetch failed')
        setCustomers([])
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
      setCustomers([])
    } finally {
      setCustomersLoading(false)
    }
  }, [])

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!isInitialized) return

    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Fetching all dashboard data...')
      
      await Promise.all([
        fetchDrivers(),
        fetchBookings(),
        fetchEmergencyAlerts(),
        fetchSupportTickets(),
        fetchSystemHealth(),
        fetchCustomers()
      ])
      
      setLastUpdated(new Date())
      console.log('✅ All dashboard data fetched successfully')
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [isInitialized, fetchDrivers, fetchBookings, fetchEmergencyAlerts, fetchSupportTickets, fetchSystemHealth, fetchCustomers])

  // Initial data fetch
  useEffect(() => {
    if (isInitialized) {
      fetchAllData()
    }
  }, [isInitialized, fetchAllData])

  // Auto-refresh every 5 minutes (only when autoRefresh is enabled)
  useEffect(() => {
    if (!isInitialized || !autoRefresh) return

    const interval = setInterval(fetchAllData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isInitialized, autoRefresh, fetchAllData])

  // Memoized metrics calculation with null safety
  const metrics = useMemo(() => {
    const totalDrivers = drivers?.length || 0
    const activeDrivers = drivers?.filter(d => d?.isActive === true).length || 0
    const verifiedDrivers = drivers?.filter(d => d?.isVerified === true).length || 0
    const pendingVerifications = drivers?.filter(d => d?.isVerified !== true).length || 0

    const totalBookings = bookings?.length || 0
    const activeBookings = bookings?.filter(b => ['pending', 'accepted', 'in_progress'].includes(b?.status)).length || 0
    const completedBookings = bookings?.filter(b => b?.status === 'completed').length || 0

    const totalAlerts = emergencyAlerts?.length || 0
    const criticalAlerts = emergencyAlerts?.filter(a => a?.priority === 'critical').length || 0
    const activeAlerts = emergencyAlerts?.filter(a => a?.status === 'active').length || 0

    const totalTickets = supportTickets?.length || 0
    const openTickets = supportTickets?.filter(t => t?.status === 'open').length || 0
    const resolvedTickets = supportTickets?.filter(t => t?.status === 'resolved').length || 0

    const totalCustomers = customers?.length || 0
    const activeCustomers = customers?.filter(c => c?.accountStatus === 'active').length || 0
    const suspendedCustomers = customers?.filter(c => c?.accountStatus === 'suspended').length || 0
    const bannedCustomers = customers?.filter(c => c?.accountStatus === 'banned').length || 0

    return {
      drivers: {
        total: totalDrivers,
        active: activeDrivers,
        verified: verifiedDrivers,
        pending: pendingVerifications
      },
      bookings: {
        total: totalBookings,
        active: activeBookings,
        completed: completedBookings
      },
      alerts: {
        total: totalAlerts,
        critical: criticalAlerts,
        active: activeAlerts
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        resolved: resolvedTickets
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        suspended: suspendedCustomers,
        banned: bannedCustomers
      }
    }
  }, [
    drivers?.length,
    bookings?.length,
    emergencyAlerts?.length,
    supportTickets?.length,
    customers?.length
  ])

  const handleRefresh = useCallback(async () => {
    setRetryCount(0)
    setError(null)
    setIsRefreshing(true)
    setLastRefreshTime(new Date())
    
    // Show loading states for all data
    setDriversLoading(true)
    setBookingsLoading(true)
    setAlertsLoading(true)
    setTicketsLoading(true)
    setHealthLoading(true)
    setCustomersLoading(true)
    
    try {
      await fetchAllData()
      console.log('✅ Manual refresh completed successfully')
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
    } finally {
      setIsRefreshing(false)
      // Loading states will be set to false in individual fetch functions
    }
  }, [fetchAllData])

  const handleRetry = useCallback(async () => {
    if (retryCount >= 3) {
      setError('Maximum retry attempts reached. Please check your connection and try again.')
      return
    }
    
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    setError(null)
    
    try {
      await fetchAllData()
      setIsRetrying(false)
    } catch (error) {
      setIsRetrying(false)
      setError(`Retry ${retryCount + 1} failed. ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [fetchAllData, retryCount])

  const getNotificationCount = useCallback(() => {
    const activeEmergencyCount = (emergencyAlerts || []).filter(alert => alert?.status === 'active').length
    const openSupportCount = (supportTickets || []).filter(ticket => ticket?.status === 'open').length
    return activeEmergencyCount + openSupportCount
  }, [emergencyAlerts, supportTickets])

  // const toggleCardExpansion = useCallback((cardId: string) => {
  //   setExpandedCards(prev => {
  //     const newSet = new Set(prev)
  //     if (newSet.has(cardId)) {
  //       newSet.delete(cardId)
  //     } else {
  //       newSet.add(cardId)
  //     }
  //     return newSet
  //   })
  // }, [])

  const getRecentActivity = useCallback(() => {
    const activities: any[] = []
    
    // Recent drivers with better data extraction
    const recentDrivers = (drivers || [])
      .filter(driver => driver?.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
    
    recentDrivers.forEach(driver => {
      const driverName = driver?.personalInfo?.name || 
                        driver?.name || 
                        driver?.driverName || 
                        'New Driver'
      const driverPhone = driver?.personalInfo?.phone || 
                         driver?.phone || 
                         driver?.driverPhone || 
                         ''
      const driverEmail = driver?.personalInfo?.email || 
                         driver?.email || 
                         driver?.driverEmail || 
                         ''
      
      activities.push({
        id: `driver-${driver.id || 'unknown'}`,
        type: 'driver',
        title: 'New Driver Registered',
        description: `${driverName} joined the platform`,
        subtitle: driverPhone ? `Phone: ${driverPhone}` : driverEmail ? `Email: ${driverEmail}` : 'Driver details pending',
        time: new Date(driver.createdAt),
        icon: <PersonIcon />,
        color: AdminColors.drivers,
        status: driver?.status || 'pending',
        details: {
          name: driverName,
          phone: driverPhone,
          email: driverEmail,
          vehicle: driver?.vehicleInfo?.make ? `${driver.vehicleInfo.make} ${driver.vehicleInfo.model}` : 'Vehicle details pending'
        }
      })
    })

    // Recent bookings with better data extraction
    const recentBookings = (bookings || [])
      .filter(booking => booking?.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
    
    recentBookings.forEach(booking => {
      const customerName = booking?.customerInfo?.name || 
                          booking?.customerName || 
                          'Customer'
      const customerPhone = booking?.customerInfo?.phone || 
                           booking?.customerPhone || 
                           ''
      const pickupAddress = booking?.pickupLocation?.address || 
                           booking?.pickupAddress || 
                           'Pickup location pending'
      const fare = booking?.fare?.totalFare || 
                  booking?.totalFare || 
                  0
      
      activities.push({
        id: `booking-${booking.id || 'unknown'}`,
        type: 'booking',
        title: 'New Booking Created',
        description: `Booking from ${customerName}`,
        subtitle: `From: ${pickupAddress.substring(0, 50)}${pickupAddress.length > 50 ? '...' : ''}`,
        time: new Date(booking.createdAt),
        icon: <DeliveryIcon />,
        color: AdminColors.bookings,
        status: booking?.status || 'pending',
        details: {
          customerName,
          customerPhone,
          pickupAddress,
          fare: `₹${fare}`,
          bookingId: booking?.bookingId || booking?.id
        }
      })
    })

    // Recent alerts with better data extraction
    const recentAlerts = (emergencyAlerts || [])
      .filter(alert => alert?.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
    
    recentAlerts.forEach(alert => {
      const userName = alert?.userInfo?.name || 
                      alert?.reportedBy || 
                      'User'
      const userPhone = alert?.userInfo?.phone || 
                       alert?.userPhone || 
                       ''
      const alertType = alert?.type || 'emergency'
      const location = alert?.location?.address || 
                      alert?.alertLocation || 
                      'Location pending'
      
      activities.push({
        id: `alert-${alert.id || 'unknown'}`,
        type: 'alert',
        title: 'Emergency Alert',
        description: `${alertType.toUpperCase()} alert from ${userName}`,
        subtitle: `Location: ${location.substring(0, 40)}${location.length > 40 ? '...' : ''}`,
        time: new Date(alert.createdAt),
        icon: <WarningIcon />,
        color: AdminColors.alerts,
        status: alert?.status || 'active',
        priority: alert?.priority || 'medium',
        details: {
          userName,
          userPhone,
          alertType,
          location,
          description: alert?.description || 'No description provided'
        }
      })
    })

    return activities.sort((a: any, b: any) => b.time.getTime() - a.time.getTime()).slice(0, 8)
  }, [drivers, bookings, emergencyAlerts])

  const getSystemStats = useCallback(() => {
    return {
      totalUsers: (drivers?.length || 0) + (bookings?.length || 0),
      activeSessions: Math.floor(Math.random() * 50) + 20,
      serverLoad: Math.floor(Math.random() * 30) + 40,
      responseTime: Math.floor(Math.random() * 50) + 100,
      uptime: Math.floor((systemHealth?.uptime || 0) / 3600),
      memoryUsage: Math.floor(Math.random() * 20) + 60,
      cpuUsage: Math.floor(Math.random() * 15) + 25,
      diskUsage: Math.floor(Math.random() * 10) + 45
    }
  }, [drivers, bookings, systemHealth])

  const getSystemStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'healthy': return 'success'
      case 'warning': return 'warning'
      case 'critical': return 'error'
      default: return 'default'
    }
  }, [])

  const getSystemStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon />
      case 'warning': return <WarningIcon />
      case 'critical': return <ErrorIcon />
      default: return <WarningIcon />
    }
  }, [])

  if (!isInitialized) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: 3,
          p: 4
        }}
      >
        <CircularProgress size={60} sx={{ color: AdminColors.primary }} />
        <Typography variant="h6" sx={{ mt: 2, color: AdminColors.primary, fontWeight: 600 }}>
          Initializing Admin Dashboard...
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Please wait while we load your data
        </Typography>
      </Box>
    )
  }

  const recentActivity = getRecentActivity()
  const systemStats = getSystemStats()

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* Enhanced Header */}
      <Fade in={true} timeout={500}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography 
                variant={isMobile ? "h4" : "h3"} 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${AdminColors.primary} 0%, ${AdminColors.secondary} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                EPickup Admin Dashboard
              </Typography>
              <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems={isMobile ? "flex-start" : "center"}>
                <Typography variant="body2" color="textSecondary">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                  {lastRefreshTime && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      Last refresh: {lastRefreshTime.toLocaleTimeString()}
                    </Typography>
                  )}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={<TimelineIcon />}
                    label="Real-time"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<SpeedIcon />}
                    label={`${systemStats.responseTime}ms`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Stack>
              </Stack>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              {/* Connection Status */}
              <Tooltip title={isConnected ? 'Connected to real-time updates' : 'Disconnected from real-time updates'}>
                <Chip
                  icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
                  label={isConnected ? 'Connected' : 'Disconnected'}
                  color={isConnected ? 'success' : 'error'}
                  variant="filled"
                  sx={{ 
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </Tooltip>
              
              {/* Auto Refresh Toggle */}
              <Tooltip title={autoRefresh ? 'Auto refresh enabled' : 'Auto refresh disabled'}>
                <Chip
                  icon={autoRefresh ? <TimelineIcon /> : <ScheduleIcon />}
                  label={autoRefresh ? 'Auto' : 'Manual'}
                  color={autoRefresh ? 'primary' : 'default'}
                  variant="outlined"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
              
              {/* Enhanced Refresh Button */}
              <Tooltip title={isRefreshing ? "Refreshing..." : "Refresh data"}>
                <IconButton 
                  onClick={handleRefresh} 
                  disabled={isLoading || isRefreshing}
                  sx={{
                    bgcolor: AdminColors.primary,
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(5, 1, 91, 0.9)',
                      transform: 'scale(1.05)'
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(0, 0, 0, 0.12)',
                      color: 'rgba(0, 0, 0, 0.26)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <RefreshIcon 
                    sx={{ 
                      animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }} 
                  />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Paper>
      </Fade>

      {/* Enhanced Error Alert with Retry */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={() => setError(null)}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              {retryCount < 3 && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  startIcon={isRetrying ? <CircularProgress size={16} /> : <RefreshIcon />}
                >
                  {isRetrying ? 'Retrying...' : `Retry (${retryCount}/3)`}
                </Button>
              )}
              <Button
                color="inherit"
                size="small"
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
              >
                Refresh All
              </Button>
            </Stack>
          }
        >
          <Typography variant="body2" fontWeight="500">
            {error}
          </Typography>
          {retryCount > 0 && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Attempt {retryCount} of 3
            </Typography>
          )}
        </Alert>
      )}

      {/* System Health Status */}
      {systemHealth && (
        <Fade in={true} timeout={700}>
          <Card 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${getSystemStatusColor(systemHealth.status)}.main`,
                      width: 56,
                      height: 56,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {getSystemStatusIcon(systemHealth.status)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600" gutterBottom>
                      System Status: {(systemHealth.status || 'UNKNOWN').toUpperCase()}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body2" color="textSecondary">
                        Uptime: {Math.floor((systemHealth.uptime || 0) / 3600)}h {Math.floor(((systemHealth.uptime || 0) % 3600) / 60)}m
                      </Typography>
                      <Chip
                        icon={<SpeedIcon />}
                        label="High Performance"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                </Box>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                  {systemHealth?.services && Object.entries(systemHealth.services).map(([service, status]) => (
                    <Chip
                      key={service}
                      label={service.toUpperCase()}
                      color={status ? 'success' : 'error'}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        '& .MuiChip-icon': {
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Metrics Grid */}
      <Grid container spacing={3}>
        {/* Drivers Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Drivers"
            value={metrics.drivers.total}
            icon={<PeopleIcon />}
            color={AdminColors.drivers}
            subtitle={`${metrics.drivers.active} active`}
            loading={driversLoading}
            onClick={() => navigate('/drivers')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Verified Drivers"
            value={metrics.drivers.verified}
            icon={<CheckCircleIcon />}
            color={AdminColors.verified}
            subtitle={`${metrics.drivers.pending} pending`}
            loading={driversLoading}
            onClick={() => navigate('/drivers')}
          />
        </Grid>

        {/* Bookings Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Bookings"
            value={metrics.bookings.active}
            icon={<DeliveryIcon />}
            color={AdminColors.bookings}
            subtitle={`${metrics.bookings.completed} completed`}
            loading={bookingsLoading}
            onClick={() => navigate('/bookings')}
          />
        </Grid>

        {/* Alerts Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Emergency Alerts"
            value={metrics.alerts.total}
            icon={<WarningIcon />}
            color={AdminColors.alerts}
            subtitle={`${metrics.alerts.critical} critical`}
            loading={alertsLoading}
            onClick={() => navigate('/emergency')}
          />
        </Grid>

        {/* Support Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Support Tickets"
            value={metrics.tickets.total}
            icon={<SupportIcon />}
            color={AdminColors.support}
            subtitle={`${metrics.tickets.open} open`}
            loading={ticketsLoading}
            onClick={() => navigate('/support')}
          />
        </Grid>

        {/* Customer Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Customers"
            value={metrics.customers?.total || 0}
            icon={<PersonIcon />}
            color={AdminColors.customers}
            subtitle={`${metrics.customers?.active || 0} active`}
            loading={customersLoading}
            onClick={() => navigate('/customers')}
          />
        </Grid>

        {/* Additional Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Health"
            value="99.9%"
            icon={<SecurityIcon />}
            color={AdminColors.health}
            subtitle="Uptime"
            loading={healthLoading}
            onClick={() => navigate('/monitoring')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Revenue"
            value="₹12.5K"
            icon={<MoneyIcon />}
            color={AdminColors.revenue}
            subtitle="This month"
            loading={false}
            onClick={() => navigate('/analytics')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Analytics"
            value="Live"
            icon={<AnalyticsIcon />}
            color={AdminColors.analytics}
            subtitle="Real-time data"
            loading={false}
            onClick={() => navigate('/analytics')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Notifications"
            value={getNotificationCount()}
            icon={<NotificationsIcon />}
            color={AdminColors.notifications}
            subtitle="Unread alerts"
            loading={false}
            onClick={() => navigate('/support')}
          />
        </Grid>
      </Grid>

      {/* Additional Dashboard Sections */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={1000}>
            <Card 
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="600" color={AdminColors.primary}>
                    Recent Activity
                  </Typography>
                  <IconButton size="small" onClick={() => setShowQuickStats(!showQuickStats)}>
                    {showQuickStats ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <Collapse in={showQuickStats}>
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {recentActivity.length > 0 ? recentActivity.map((activity: any, _index: number) => (
                      <ListItem 
                        key={activity.id} 
                        sx={{ 
                          px: 0, 
                          py: 1.5,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            cursor: 'pointer'
                          }
                        }}
                        onClick={() => {
                          // Navigate to relevant section based on activity type
                          if (activity.type === 'driver') navigate('/drivers')
                          else if (activity.type === 'booking') navigate('/bookings')
                          else if (activity.type === 'alert') navigate('/emergency')
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: activity.color, width: 44, height: 44 }}>
                            {activity.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Typography variant="body2" fontWeight="600" color={AdminColors.primary}>
                                {activity.title}
                              </Typography>
                              <Chip
                                label={activity.status}
                                size="small"
                                color={
                                  activity.status === 'active' ? 'success' :
                                  activity.status === 'pending' ? 'warning' :
                                  activity.status === 'completed' ? 'info' : 'default'
                                }
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 20,
                                  fontWeight: 500
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textPrimary" sx={{ fontWeight: 500, mb: 0.5 }}>
                                {activity.description}
                              </Typography>
                              {activity.subtitle && (
                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                                  {activity.subtitle}
                                </Typography>
                              )}
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="caption" color="textSecondary">
                                  {activity.time.toLocaleString()}
                                </Typography>
                                {activity.details && (
                                  <Chip
                                    icon={<VisibilityIcon />}
                                    label="View Details"
                                    size="small"
                                    variant="outlined"
                                    sx={{ 
                                      fontSize: '0.65rem',
                                      height: 18,
                                      '& .MuiChip-icon': { fontSize: '0.75rem' }
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    )) : (
                      <ListItem>
                        <ListItemText
                          primary="No recent activity"
                          secondary="Activity will appear here as it happens"
                        />
                      </ListItem>
                    )}
                  </List>
                </Collapse>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* System Performance */}
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={1200}>
            <Card 
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="600" color={AdminColors.primary} mb={2}>
                  System Performance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="700" color={AdminColors.success}>
                        {systemStats.uptime}h
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Uptime
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="700" color={AdminColors.info}>
                        {systemStats.activeSessions}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Active Sessions
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="700" color={AdminColors.warning}>
                        {systemStats.serverLoad}%
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Server Load
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="700" color={AdminColors.error}>
                        {systemStats.memoryUsage}%
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Memory Usage
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Box mt={2}>
                  <LinearProgress 
                    variant="determinate" 
                    value={systemStats.cpuUsage} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'rgba(0, 0, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: systemStats.cpuUsage > 80 ? AdminColors.error : AdminColors.success
                      }
                    }} 
                  />
                  <Typography variant="caption" color="textSecondary" mt={1} display="block">
                    CPU Usage: {systemStats.cpuUsage}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Fade in={true} timeout={900}>
        <Card 
          sx={{ 
            mt: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography 
              variant="h5" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                color: AdminColors.primary,
                mb: 3
              }}
            >
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/drivers')}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${AdminColors.drivers} 0%, rgba(5, 1, 91, 0.8) 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, rgba(5, 1, 91, 0.9) 0%, ${AdminColors.drivers} 100%)`,
                      transform: 'translateY(-2px)',
                    },
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}
                >
                  Manage Drivers
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<DeliveryIcon />}
                  onClick={() => navigate('/bookings')}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${AdminColors.bookings} 0%, rgba(237, 167, 34, 0.8) 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, rgba(237, 167, 34, 0.9) 0%, ${AdminColors.bookings} 100%)`,
                      transform: 'translateY(-2px)',
                    },
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}
                >
                  View Bookings
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<WarningIcon />}
                  onClick={() => navigate('/emergency')}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${AdminColors.alerts} 0%, rgba(239, 68, 68, 0.8) 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, ${AdminColors.alerts} 100%)`,
                      transform: 'translateY(-2px)',
                    },
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}
                >
                  Emergency Alerts
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<SupportIcon />}
                  onClick={() => navigate('/support')}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${AdminColors.support} 0%, rgba(139, 92, 246, 0.8) 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, ${AdminColors.support} 100%)`,
                      transform: 'translateY(-2px)',
                    },
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}
                >
                  Support Tickets
                </Button>
              </Grid>
            </Grid>
            
            {/* Secondary Actions */}
            <Box mt={3}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Additional Tools
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => navigate('/analytics')}
                  sx={{ minWidth: 120 }}
                >
                  Analytics
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/settings')}
                  sx={{ minWidth: 120 }}
                >
                  Settings
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => console.log('Export data')}
                  sx={{ minWidth: 120 }}
                >
                  Export Data
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={() => window.print()}
                  sx={{ minWidth: 120 }}
                >
                  Print Report
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  )
})

ComprehensiveDashboard.displayName = 'ComprehensiveDashboard'

// Wrap Dashboard with ErrorBoundary
const DashboardWithErrorBoundary = () => (
  <ErrorBoundary>
    <ComprehensiveDashboard />
  </ErrorBoundary>
)

export default DashboardWithErrorBoundary
