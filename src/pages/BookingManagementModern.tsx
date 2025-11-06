import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Tooltip,
  Alert,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CardHeader,
  CardActions,
  Switch,
  FormControlLabel,
  InputAdornment,
  Skeleton,
  AlertTitle,
  useMediaQuery,
  Fade,
} from '@mui/material'
import {
  LocalShipping as LocalShippingIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { comprehensiveAdminService } from '../services/comprehensiveAdminService'
import { bookingService } from '../services/bookingService'

// Modern Color Theme
const theme = {
  primary: '#05015B',
  primaryLight: '#1a1a7a',
  primaryDark: '#03012a',
  secondary: '#f50057',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  background: '#f8fafc',
  surface: '#ffffff',
  text: {
    primary: '#1a202c',
    secondary: '#718096',
    disabled: '#a0aec0',
  },
  border: '#e2e8f0',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowLarge: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
}

interface Booking {
  id: string
  customerId: string
  driverId?: string
  pickupLocation: {
    address: string
    coordinates: { lat: number; lng: number }
  }
  dropoffLocation: {
    address: string
    coordinates: { lat: number; lng: number }
  }
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  fare: number
  distance: number
  estimatedTime: number
  createdAt: string
  updatedAt: string
  customerName?: string
  driverName?: string
  driverVerified?: boolean
  packageDetails?: {
    weight: number
    description: string
    value: number
  }
  paymentStatus?: string
  // Contact information
  senderInfo?: {
    name: string
    phone: string
  }
  recipientInfo?: {
    name: string
    phone: string
  }
  // Photo verifications
  pickupVerification?: {
    photoUrl: string
    verifiedAt: string
    verifiedBy: string
    location?: {
      latitude: number
      longitude: number
    }
    notes?: string
  }
  deliveryVerification?: {
    photoUrl: string
    verifiedAt: string
    verifiedBy: string
    location?: {
      latitude: number
      longitude: number
    }
    notes?: string
  }
}

const ModernBookingManagement: React.FC = React.memo(() => {
  // ✅ UNIFIED STATUS DEFINITION: Match backend exactly
  const statusOptions = ['pending', 'driver_assigned', 'accepted', 'driver_enroute', 'driver_arrived', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled', 'rejected']
  
  const [isInitialized, setIsInitialized] = useState(false)
  // const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isConnected, setIsConnected] = useState(false)

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activeBookings, setActiveBookings] = useState<Booking[]>([])
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([])
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([])

  // Loading states
  const [bookingsLoading, setBookingsLoading] = useState(false)

  // Dialog states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Enhanced UI states
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  // const [tabValue, setTabValue] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval] = useState(30000) // 30 seconds
  
  // Responsive and column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    bookingId: true,
    customer: true,
    driver: true,
    pickup: true,
    contact: true,
    status: true,
    payment: true,
    fare: true,
    created: true,
    actions: true
  })
  
  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 600px)')
  const isTablet = useMediaQuery('(max-width: 960px)')
  const isMobileDialog = useMediaQuery('(max-width: 600px)') // For fullscreen dialogs on mobile
  // const isDesktop = useMediaQuery('(min-width: 1200px)')
  
  // Auto-adjust view mode based on screen size
  useEffect(() => {
    if (isMobile) {
      setViewMode('grid')
    }
  }, [isMobile])
  
  // Responsive column management
  useEffect(() => {
    if (isMobile) {
      // Show only 4 essential columns on mobile for better readability
      setVisibleColumns({
        bookingId: false,     // Hide - shown in detail view
        customer: true,       // Keep - primary identifier
        driver: false,        // Hide - shown in detail
        pickup: false,        // Hide - shown in detail
        contact: false,       // Hide - shown in detail
        status: true,         // Keep - critical info
        payment: false,       // Hide - shown in detail
        fare: true,           // Keep - important for admin
        created: false,       // Hide - less critical on mobile
        actions: true         // Keep - view/edit buttons
      })
    } else if (isTablet) {
      // Show 6 important columns on tablet
      setVisibleColumns({
        bookingId: true,
        customer: true,
        driver: true,
        pickup: false,        // Hide on tablet too
        contact: false,       // Hide on tablet too
        status: true,
        payment: true,
        fare: true,
        created: false,       // Hide on tablet
        actions: true
      })
    } else {
      // Show all columns on desktop
      setVisibleColumns({
        bookingId: true,
        customer: true,
        driver: true,
        pickup: true,
        contact: true,
        status: true,
        payment: true,
        fare: true,
        created: true,
        actions: true
      })
    }
  }, [isMobile, isTablet])
  
  // Toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev]
    }))
  }
  
  // Column settings dialog state
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  
  // Advanced features
  const [selectedBookings, setSelectedBookings] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState('')
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')
  const [showExportDialog, setShowExportDialog] = useState(false)
  
  // Enhanced UI features
  const [showNotifications, setShowNotifications] = useState(true)
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'info', timestamp: Date}>>([])
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  // const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [driverFilter, setDriverFilter] = useState('all')

  // Initialize service
  useEffect(() => {
    const initializeService = async (): Promise<void> => {
      try {
        console.log('🔄 Initializing Modern Booking Management Service...')
        await comprehensiveAdminService.initialize()
        
        // Setup real-time listeners
        comprehensiveAdminService.setupRealTimeListeners()
        
        setIsInitialized(true)
        console.log('✅ Modern Booking Management Service initialized successfully')
        
        // Setup real-time event listeners
        const handleBookingUpdate = (event: CustomEvent) => {
          console.log('📦 Booking update received:', event.detail)
          fetchBookings()
        }
        
        window.addEventListener('bookingUpdate', handleBookingUpdate as any)
        
      } catch (error) {
        console.error('❌ Failed to initialize Modern Booking Management Service:', error)
        setError('Failed to initialize booking management service. Please refresh the page.')
      }
    }

    initializeService()

    // Cleanup function
    return () => {
      // Cleanup is handled by useEffect
    }
  }, [])

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    try {
      setBookingsLoading(true)
      console.log('🔄 Fetching bookings...')
      
      const response = await comprehensiveAdminService.getBookings()
      
      if (response.success && response.data) {
        const bookingsData = response.data as any[]
        
        // Normalize and validate booking data
        const normalizedBookings = bookingsData.map(booking => {
          try {
            // Extract fare from the mapped data structure
            let fareAmount = 0;
            if (typeof booking.fare === 'number') {
              fareAmount = booking.fare;
            } else if (booking.fare && typeof booking.fare === 'object') {
              // Handle the enhanced fare structure from fare calculation service
              fareAmount = booking.fare.totalFare || booking.fare.baseFare || booking.fare.total || 0;
            }
            
            // Extract customer name from customerInfo or fallback to pickup name
            const customerName = booking.customerInfo?.name || booking.customerName || 'Unknown Customer';
            
            // Extract driver name from driverInfo or fallback
            const driverName = booking.driverInfo?.name || booking.driverName || 'No Driver Assigned';
            
            return {
              ...booking,
              id: booking.id || `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              status: booking.status || 'unknown',
              fare: fareAmount,
              customerName: customerName,
              driverName: driverName,
              pickupLocation: booking.pickupLocation || { address: 'No pickup address', coordinates: { lat: 0, lng: 0 } },
              dropoffLocation: booking.dropoffLocation || { address: 'No dropoff address', coordinates: { lat: 0, lng: 0 } },
              paymentStatus: booking.paymentStatus || 'pending',
              createdAt: booking.createdAt || new Date().toISOString(),
              updatedAt: booking.updatedAt || new Date().toISOString(),
              driverVerified: booking.driverVerified || false,
              // Contact information
              senderInfo: {
                name: booking.senderInfo?.name || booking.pickup?.name || 'Sender',
                phone: booking.senderInfo?.phone || booking.pickup?.phone || '+91 9876543210'
              },
              recipientInfo: {
                name: booking.recipientInfo?.name || booking.dropoff?.name || 'Recipient',
                phone: booking.recipientInfo?.phone || booking.dropoff?.phone || '+91 9876543210'
              }
            }
          } catch (error) {
            console.error('Error normalizing booking:', error, booking)
            return {
              id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              status: 'unknown',
              fare: 0,
              customerName: 'Unknown Customer',
              driverName: 'No Driver Assigned',
              pickupLocation: { address: 'No pickup address', coordinates: { lat: 0, lng: 0 } },
              dropoffLocation: { address: 'No dropoff address', coordinates: { lat: 0, lng: 0 } },
              paymentStatus: 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              driverVerified: false
            }
          }
        })
        
        setBookings(normalizedBookings)
        
        // Categorize bookings for better management
        const active = normalizedBookings.filter(booking => 
          ['pending', 'accepted', 'in_progress'].includes(booking.status)
        )
        const completed = normalizedBookings.filter(booking => 
          booking.status === 'completed'
        )
        const cancelled = normalizedBookings.filter(booking => 
          booking.status === 'cancelled'
        )
        
        setActiveBookings(active)
        setCompletedBookings(completed)
        setCancelledBookings(cancelled)
        
        // Calculate pagination
        setTotalPages(Math.ceil(normalizedBookings.length / 10))
        
        setIsConnected(true)
        console.log('✅ Bookings fetched successfully:', normalizedBookings.length)
      } else {
        console.error('❌ Failed to fetch bookings:', response.error)
        setError('Failed to fetch bookings data')
        setIsConnected(false)
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error)
      setError('Failed to fetch bookings data')
      setIsConnected(false)
    } finally {
      setBookingsLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    if (isInitialized) {
      fetchBookings()
    }
  }, [isInitialized, fetchBookings])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && isInitialized) {
      const interval = setInterval(() => {
        fetchBookings()
      }, refreshInterval)
      return () => clearInterval(interval)
    }
    return undefined
  }, [autoRefresh, refreshInterval, isInitialized, fetchBookings])

  // Handle status update
  const handleStatusUpdate = useCallback(async (): Promise<void> => {
    if (!selectedBooking || !newStatus) return

    try {
      setIsUpdating(true)
      console.log('🔄 Updating booking status...', { bookingId: selectedBooking.id, status: newStatus })
      
      // Call the actual API to update booking status
      await bookingService.updateBookingStatus(selectedBooking.id, newStatus)
      
      // Update local state after successful API call
      setBookings(prev => prev.map(booking => 
        booking.id === selectedBooking.id 
          ? { ...booking, status: newStatus as any, updatedAt: new Date().toISOString() }
          : booking
      ))
      
      setStatusDialogOpen(false)
      setSelectedBooking(null)
      setNewStatus('')
      
      addNotification(`Booking status updated to ${newStatus}`, 'success')
      console.log('✅ Booking status updated successfully')
      
      // Refresh bookings to get latest data
      setTimeout(() => fetchBookings(), 500)
    } catch (error) {
      console.error('❌ Error updating booking status:', error)
      addNotification('Failed to update booking status', 'error')
    } finally {
      setIsUpdating(false)
    }
  }, [selectedBooking, newStatus, fetchBookings])

  // Handle page change
  // const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, page: number) => {
  //   setCurrentPage(page)
  // }, [])

  // Handle delete booking
  const handleDeleteBooking = useCallback(async (): Promise<void> => {
    if (!selectedBooking) return

    try {
      setIsUpdating(true)
      console.log('🗑️ Deleting booking...', { bookingId: selectedBooking.id })
      
      // Call the API to delete booking
      await bookingService.deleteBooking(selectedBooking.id, deleteReason)
      
      // Remove from local state
      setBookings(prev => prev.filter(booking => booking.id !== selectedBooking.id))
      
      setDeleteDialogOpen(false)
      setSelectedBooking(null)
      setDeleteReason('')
      
      addNotification('Booking deleted successfully', 'success')
      console.log('✅ Booking deleted successfully')
      
      // Refresh bookings to get latest data
      setTimeout(() => fetchBookings(), 500)
    } catch (error) {
      console.error('❌ Error deleting booking:', error)
      addNotification('Failed to delete booking', 'error')
    } finally {
      setIsUpdating(false)
    }
  }, [selectedBooking, deleteReason, fetchBookings])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchBookings()
  }, [fetchBookings])

  // Helper functions
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pending': return theme.warning
      case 'driver_assigned': return theme.info
      case 'accepted': return theme.primary
      case 'driver_enroute': return theme.primary
      case 'driver_arrived': return theme.primary
      case 'picked_up': return theme.primary
      case 'in_transit': return theme.primary
      case 'delivered': return theme.success
      case 'completed': return theme.success
      case 'cancelled': return theme.error
      case 'rejected': return theme.error
      case 'unknown': return theme.text.disabled
      default: return theme.text.disabled
    }
  }, [])

  const getPaymentStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return theme.success
      case 'confirmed': return theme.success // ✅ FIX: Handle 'confirmed' status (same as 'completed')
      case 'pending': return theme.warning
      case 'failed': return theme.error
      case 'refunded': return theme.info
      default: return theme.text.disabled
    }
  }, [])

  const formatTime = useCallback((timestamp: string) => {
    if (!timestamp) return 'Unknown'
    try {
      return new Date(timestamp).toLocaleString()
    } catch (error) {
      return 'Invalid Date'
    }
  }, [])

  // Enhanced filtering and search
  const filteredBookings = useMemo(() => {
    let filtered = bookings

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.id.toLowerCase().includes(query) ||
        booking.customerName?.toLowerCase().includes(query) ||
        booking.driverName?.toLowerCase().includes(query) ||
        booking.pickupLocation?.address?.toLowerCase().includes(query) ||
        booking.dropoffLocation?.address?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(booking => new Date(booking.createdAt) >= filterDate)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(booking => new Date(booking.createdAt) >= filterDate)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(booking => new Date(booking.createdAt) >= filterDate)
          break
      }
    }

    // Apply driver filter
    if (driverFilter !== 'all') {
      switch (driverFilter) {
        case 'verified':
          filtered = filtered.filter(booking => booking.driverId && booking.driverVerified)
          break
        case 'unverified':
          filtered = filtered.filter(booking => booking.driverId && !booking.driverVerified)
          break
        case 'unassigned':
          filtered = filtered.filter(booking => !booking.driverId)
          break
      }
    }

    return filtered
  }, [bookings, searchQuery, statusFilter, dateFilter, driverFilter])

  // Enhanced filtering with sorting
  const enhancedFilteredBookings = useMemo(() => {
    let filtered = filteredBookings

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'fare':
          aValue = a.fare || 0
          bValue = b.fare || 0
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'customerName':
          aValue = a.customerName || ''
          bValue = b.customerName || ''
          break
        default:
          aValue = a[sortBy as keyof Booking] || ''
          bValue = b[sortBy as keyof Booking] || ''
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [filteredBookings, sortBy, sortOrder])

  // Memoized paginated bookings
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * 10
    const endIndex = startIndex + 10
    return enhancedFilteredBookings.slice(startIndex, endIndex)
  }, [enhancedFilteredBookings, currentPage])

  // Bulk actions
  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selectedBookings.length === 0) return

    try {
      console.log('🔄 Performing bulk action...', { action: bulkAction, count: selectedBookings.length })
      
      // Update local state for bulk actions
      setBookings(prev => prev.map(booking => 
        selectedBookings.includes(booking.id)
          ? { ...booking, status: bulkAction as any, updatedAt: new Date().toISOString() }
          : booking
      ))
      
      setSelectedBookings([])
      setBulkAction('')
      setShowBulkActions(false)
      
      addNotification(`Updated ${selectedBookings.length} bookings to ${bulkAction}`, 'success')
      console.log('✅ Bulk action completed successfully')
    } catch (error) {
      console.error('❌ Error performing bulk action:', error)
      setError('Failed to perform bulk action')
    }
  }, [bulkAction, selectedBookings])

  // Export functionality
  const handleExport = useCallback(() => {
    try {
      const dataToExport = filteredBookings.map(booking => ({
        'Booking ID': booking.id,
        'Customer Name': booking.customerName,
        'Driver Name': booking.driverName,
        'Status': booking.status,
        'Fare': booking.fare,
        'Payment Status': booking.paymentStatus,
        'Pickup Address': booking.pickupLocation?.address,
        'Created At': formatTime(booking.createdAt)
      }))

      if (exportFormat === 'csv') {
        const csvContent = [
          Object.keys(dataToExport[0] || {}).join(','),
          ...dataToExport.map(row => Object.values(row || {}).join(','))
        ].join('\n')
        
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
      
      setShowExportDialog(false)
      console.log('✅ Export completed successfully')
    } catch (error) {
      console.error('❌ Error exporting data:', error)
      setError('Failed to export data')
    }
  }, [filteredBookings, exportFormat, formatTime])

  // Handle booking selection
  const handleBookingSelection = useCallback((bookingId: string, selected: boolean) => {
    setSelectedBookings(prev => 
      selected 
        ? [...prev, bookingId]
        : prev.filter(id => id !== bookingId)
    )
  }, [])

  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedBookings(paginatedBookings.map(booking => booking.id))
    } else {
      setSelectedBookings([])
    }
  }, [paginatedBookings])

  // Notification system
  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    }
    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // Keep only last 5 notifications
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }, [])

  // Enhanced sorting
  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }, [sortBy])


  if (!isInitialized) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        sx={{ 
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
          borderRadius: 3,
          color: 'white'
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h5" fontWeight="600" mb={1}>
          Initializing Booking Management
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Setting up real-time monitoring and data synchronization...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ background: theme.background, minHeight: '100vh', p: 3 }}>
      {/* Modern Header */}
      <Box 
        sx={{ 
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
          borderRadius: 3,
          p: 4,
          mb: 4,
          color: 'white',
          boxShadow: theme.shadowLarge
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h3" component="h1" fontWeight="700" mb={1}>
              📦 Booking Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Monitor and manage all delivery bookings in real-time
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
              label={isConnected ? "Live" : "Offline"}
              sx={{ 
                background: isConnected ? theme.success : theme.error,
                color: 'white',
                fontWeight: 600
              }}
            />
            <IconButton 
              onClick={handleRefresh} 
              disabled={bookingsLoading}
              sx={{ 
                background: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { background: 'rgba(255,255,255,0.3)' }
              }}
            >
              <RefreshIcon />
            </IconButton>
            <Tooltip title={showNotifications ? "Hide Notifications" : "Show Notifications"}>
              <IconButton 
                onClick={() => setShowNotifications(!showNotifications)}
                sx={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '&:hover': { background: 'rgba(255,255,255,0.3)' }
                }}
              >
                {showNotifications ? <CheckCircleIcon /> : <CancelIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', background: 'rgba(255,255,255,0.15)' }
            }}>
              <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h4" fontWeight="700" color="white">
                  {bookings.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Total Bookings
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 1 }}>
                  All time
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', background: 'rgba(255,255,255,0.15)' }
            }}>
              <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h4" fontWeight="700" color="white">
                  {activeBookings.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Active Bookings
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 1 }}>
                  In progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', background: 'rgba(255,255,255,0.15)' }
            }}>
              <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h4" fontWeight="700" color="white">
                  {completedBookings.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Completed
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 1 }}>
                  Success rate: {bookings.length > 0 ? Math.round((completedBookings.length / bookings.length) * 100) : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', background: 'rgba(255,255,255,0.15)' }
            }}>
              <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h4" fontWeight="700" color="white">
                  {cancelledBookings.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Cancelled
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 1 }}>
                  Cancellation rate: {bookings.length > 0 ? Math.round((cancelledBookings.length / bookings.length) * 100) : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Notifications */}
      {showNotifications && notifications.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {notifications.map((notification) => (
            <Fade key={notification.id} in={true}>
              <Alert 
                severity={notification.type}
                sx={{ mb: 1, borderRadius: 2 }}
                onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              >
                {notification.message}
              </Alert>
            </Fade>
          ))}
        </Box>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 4, boxShadow: theme.shadow }}>
        <CardContent>
          <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme.primary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: theme.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.primary,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  label="Date"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Driver</InputLabel>
                <Select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  label="Driver"
                >
                  <MenuItem value="all">All Drivers</MenuItem>
                  <MenuItem value="verified">Verified</MenuItem>
                  <MenuItem value="unverified">Unverified</MenuItem>
                  <MenuItem value="unassigned">Unassigned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                  startIcon={<AssessmentIcon />}
                  sx={{ 
                    background: viewMode === 'table' ? theme.primary : 'transparent',
                    color: viewMode === 'table' ? 'white' : theme.primary,
                    borderColor: theme.primary,
                    '&:hover': {
                      background: viewMode === 'table' ? theme.primaryLight : theme.primary + '10',
                    }
                  }}
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('grid')}
                  startIcon={<LocalShippingIcon />}
                  sx={{ 
                    background: viewMode === 'grid' ? theme.primary : 'transparent',
                    color: viewMode === 'grid' ? 'white' : theme.primary,
                    borderColor: theme.primary,
                    '&:hover': {
                      background: viewMode === 'grid' ? theme.primaryLight : theme.primary + '10',
                    }
                  }}
                >
                  Grid
                </Button>
                
                {/* Column Visibility Controls */}
                {viewMode === 'table' && !isMobile && (
                  <Tooltip title="Column Settings">
                    <IconButton
                      onClick={() => setShowColumnSettings(!showColumnSettings)}
                      sx={{ 
                        color: theme.primary,
                        border: `1px solid ${theme.primary}`,
                        borderRadius: 1,
                        ml: 1
                      }}
                    >
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>
          
          {/* Advanced Actions Row */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center" sx={{ mt: { xs: 1.5, sm: 2 } }}>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} alignItems="center">
                {selectedBookings.length > 0 && (
                  <Chip
                    label={`${selectedBookings.length} selected`}
                    color="primary"
                    onDelete={() => setSelectedBookings([])}
                    sx={{ mr: 1 }}
                  />
                )}
                {selectedBookings.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setShowBulkActions(true)}
                    sx={{ borderColor: theme.primary, color: theme.primary }}
                  >
                    Bulk Actions
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => setShowExportDialog(true)}
                  sx={{ borderColor: theme.success, color: theme.success }}
                >
                  Export
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Auto Refresh"
                />
                <Typography variant="body2" color={theme.text.secondary}>
                  Showing {filteredBookings.length} of {bookings.length} bookings
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {bookingsLoading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress sx={{ borderRadius: 1 }} />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: theme.text.secondary }}>
            Loading bookings...
          </Typography>
        </Box>
      )}

      {/* Loading Skeleton */}
      {bookingsLoading && paginatedBookings.length === 0 && (
        <Card sx={{ boxShadow: theme.shadow }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Loading Bookings...
            </Typography>
            {[...Array(5)].map((_, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Column Settings Dialog */}
      <Dialog open={showColumnSettings} onClose={() => setShowColumnSettings(false)} maxWidth="sm" fullWidth fullScreen={isMobileDialog}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Column Visibility</Typography>
            <IconButton onClick={() => setShowColumnSettings(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Choose which columns to display in the table view
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(visibleColumns).map(([column, visible]) => (
              <Grid item xs={6} sm={4} key={column}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={visible}
                      onChange={() => toggleColumnVisibility(column)}
                      color="primary"
                    />
                  }
                  label={column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowColumnSettings(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // Reset to default
              setVisibleColumns({
                bookingId: true,
                customer: true,
                driver: true,
                pickup: true,
                contact: true,
                status: true,
                payment: true,
                fare: true,
                created: true,
                actions: true
              })
            }}
          >
            Reset to Default
          </Button>
        </DialogActions>
      </Dialog>

      {/* Responsive Info Bar */}
      {viewMode === 'table' && (
        <Card sx={{ mb: 2, p: 2, bgcolor: theme.primary + '05' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="textSecondary">
                Showing {Object.values(visibleColumns).filter(Boolean).length} of 9 columns
              </Typography>
              {isMobile && (
                <Chip 
                  label="Mobile View" 
                  size="small" 
                  color="info" 
                  variant="outlined"
                />
              )}
              {isTablet && !isMobile && (
                <Chip 
                  label="Tablet View" 
                  size="small" 
                  color="info" 
                  variant="outlined"
                />
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="caption" color="textSecondary">
                {isMobile ? 'Essential columns only' : isTablet ? 'Key columns shown' : 'All columns visible'}
              </Typography>
              {!isMobile && (
                <Button
                  size="small"
                  onClick={() => setShowColumnSettings(true)}
                  startIcon={<SettingsIcon />}
                  sx={{ ml: 1 }}
                >
                  Customize
                </Button>
              )}
            </Box>
          </Box>
        </Card>
      )}

      {/* Bookings Table/Grid */}
      {viewMode === 'table' ? (
        <Card sx={{ boxShadow: theme.shadow }}>
          <TableContainer sx={{ 
            maxWidth: '100%',
            overflowX: 'auto',
            position: 'relative',
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.primary,
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: theme.primaryDark,
            },
            // Scroll hint gradient for mobile/tablet
            '&::after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: '8px',
              width: '40px',
              background: 'linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
              pointerEvents: 'none',
              display: { xs: 'block', md: 'none' },
              zIndex: 1
            }
          }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ background: theme.primary + '05' }}>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedBookings.length === paginatedBookings.length && paginatedBookings.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                  </TableCell>
                  
                  {visibleColumns.bookingId && (
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.primary,
                        cursor: 'pointer',
                        minWidth: 120,
                        '&:hover': { backgroundColor: theme.primary + '10' }
                      }}
                      onClick={() => handleSort('id')}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        Booking ID
                        {sortBy === 'id' && (
                          sortOrder === 'asc' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                  )}
                  
                  {visibleColumns.customer && (
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.primary,
                        cursor: 'pointer',
                        minWidth: 150,
                        '&:hover': { backgroundColor: theme.primary + '10' }
                      }}
                      onClick={() => handleSort('customerName')}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        Customer
                        {sortBy === 'customerName' && (
                          sortOrder === 'asc' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                  )}
                  
                  {visibleColumns.driver && (
                    <TableCell sx={{ fontWeight: 600, color: theme.primary, minWidth: 120 }}>
                      Driver
                    </TableCell>
                  )}
                  
                  {visibleColumns.pickup && (
                    <TableCell sx={{ fontWeight: 600, color: theme.primary, minWidth: 200 }}>
                      Pickup
                    </TableCell>
                  )}
                  
                  {visibleColumns.contact && (
                    <TableCell sx={{ fontWeight: 600, color: theme.primary, minWidth: 200 }}>
                      Contact Info
                    </TableCell>
                  )}
                  
                  {visibleColumns.status && (
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.primary,
                        cursor: 'pointer',
                        minWidth: 100,
                        '&:hover': { backgroundColor: theme.primary + '10' }
                      }}
                      onClick={() => handleSort('status')}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        Status
                        {sortBy === 'status' && (
                          sortOrder === 'asc' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                  )}
                  
                  {visibleColumns.payment && (
                    <TableCell sx={{ fontWeight: 600, color: theme.primary, minWidth: 100 }}>
                      Payment
                    </TableCell>
                  )}
                  
                  {visibleColumns.fare && (
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.primary,
                        cursor: 'pointer',
                        minWidth: 80,
                        '&:hover': { backgroundColor: theme.primary + '10' }
                      }}
                      onClick={() => handleSort('fare')}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        Fare
                        {sortBy === 'fare' && (
                          sortOrder === 'asc' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                  )}
                  
                  {visibleColumns.created && (
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.primary,
                        cursor: 'pointer',
                        minWidth: 120,
                        '&:hover': { backgroundColor: theme.primary + '10' }
                      }}
                      onClick={() => handleSort('createdAt')}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        Created
                        {sortBy === 'createdAt' && (
                          sortOrder === 'asc' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                  )}
                  
                  {visibleColumns.actions && (
                    <TableCell sx={{ fontWeight: 600, color: theme.primary, minWidth: 100 }}>
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedBookings.map((booking) => (
                  <TableRow 
                    key={booking.id}
                    hover
                    sx={{ 
                      '&:hover': { 
                        background: theme.primary + '05',
                        transform: 'translateY(-1px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.id)}
                        onChange={(e) => handleBookingSelection(booking.id, e.target.checked)}
                        style={{ transform: 'scale(1.2)' }}
                      />
                    </TableCell>
                    
                    {visibleColumns.bookingId && (
                      <TableCell>
                        <Typography variant="body2" fontWeight="600" color={theme.primary}>
                          #{booking.id.substring(0, 8)}
                        </Typography>
                      </TableCell>
                    )}
                    
                    {visibleColumns.customer && (
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="600">
                            {booking.customerName || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color={theme.text.secondary}>
                            {booking.customerId}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    
                    {visibleColumns.driver && (
                      <TableCell>
                        {booking.driverId ? (
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {booking.driverName || 'Unknown'}
                            </Typography>
                            <Chip
                              label={booking.driverVerified ? 'Verified' : 'Unverified'}
                              color={booking.driverVerified ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color={theme.text.secondary}>
                            Not assigned
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    
                    {visibleColumns.pickup && (
                      <TableCell>
                        <Typography variant="body2" title={booking.pickupLocation?.address || 'No pickup address'}>
                          {booking.pickupLocation?.address?.substring(0, 30) || 'No pickup address'}...
                        </Typography>
                      </TableCell>
                    )}
                    
                    {visibleColumns.contact && (
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="600" color={theme.primary}>
                            Sender: {booking.senderInfo?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color={theme.text.secondary}>
                            {booking.senderInfo?.phone || 'N/A'}
                          </Typography>
                          <Typography variant="body2" fontWeight="600" color={theme.primary} sx={{ mt: 0.5 }}>
                            Recipient: {booking.recipientInfo?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color={theme.text.secondary}>
                            {booking.recipientInfo?.phone || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    
                    {visibleColumns.status && (
                      <TableCell>
                        <Chip
                          label={(booking.status || 'unknown').replace('_', ' ')}
                          sx={{
                            background: getStatusColor(booking.status || 'unknown'),
                            color: 'white',
                            fontWeight: 600
                          }}
                          size="small"
                        />
                      </TableCell>
                    )}
                    
                    {visibleColumns.payment && (
                      <TableCell>
                        <Chip
                          label={booking.paymentStatus || 'pending'}
                          sx={{
                            background: getPaymentStatusColor(booking.paymentStatus || 'pending'),
                            color: 'white',
                            fontWeight: 600
                          }}
                          size="small"
                        />
                      </TableCell>
                    )}
                    
                    {visibleColumns.fare && (
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color={theme.primary}>
                          ₹{booking.fare || 0}
                        </Typography>
                      </TableCell>
                    )}
                    
                    {visibleColumns.created && (
                      <TableCell>
                        <Typography variant="body2">
                          {formatTime(booking.createdAt)}
                        </Typography>
                      </TableCell>
                    )}
                    
                    {visibleColumns.actions && (
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedBooking(booking)
                                setViewDialogOpen(true)
                              }}
                              sx={{ color: theme.primary }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Status">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedBooking(booking)
                                setNewStatus(booking.status)
                                setStatusDialogOpen(true)
                              }}
                              sx={{ color: theme.warning }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Booking">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedBooking(booking)
                                setDeleteDialogOpen(true)
                              }}
                              sx={{ color: theme.error }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {paginatedBookings.map((booking) => (
            <Grid item xs={12} sm={6} md={4} key={booking.id}>
              <Card 
                sx={{ 
                  boxShadow: theme.shadow,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadowLarge,
                  }
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ background: theme.primary }}>
                      <LocalShippingIcon />
                    </Avatar>
                  }
                  title={
                    <Typography variant="h6" fontWeight="600" color={theme.primary}>
                      #{booking.id.substring(0, 8)}
                    </Typography>
                  }
                  action={
                    <Chip
                      label={(booking.status || 'unknown').replace('_', ' ')}
                      sx={{
                        background: getStatusColor(booking.status || 'unknown'),
                        color: 'white',
                        fontWeight: 600
                      }}
                      size="small"
                    />
                  }
                />
                <CardContent>
                  <Box mb={2}>
                    <Typography variant="body2" color={theme.text.secondary} gutterBottom>
                      Customer
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {booking.customerName || 'Unknown Customer'}
                    </Typography>
                  </Box>
                  
                  <Box mb={2}>
                    <Typography variant="body2" color={theme.text.secondary} gutterBottom>
                      Driver
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {booking.driverName || 'Not Assigned'}
                    </Typography>
                    {booking.driverId && (
                      <Chip
                        label={booking.driverVerified ? 'Verified' : 'Unverified'}
                        color={booking.driverVerified ? 'success' : 'warning'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color={theme.text.secondary} gutterBottom>
                      Pickup Location
                    </Typography>
                    <Typography variant="body2">
                      {booking.pickupLocation?.address || 'No pickup address'}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="body2" color={theme.text.secondary}>
                        Fare
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color={theme.primary}>
                        ₹{booking.fare || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color={theme.text.secondary}>
                        Payment
                      </Typography>
                      <Chip
                        label={booking.paymentStatus || 'pending'}
                        sx={{
                          background: getPaymentStatusColor(booking.paymentStatus || 'pending'),
                          color: 'white',
                          fontWeight: 600
                        }}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Typography variant="caption" color={theme.text.secondary}>
                    Created: {formatTime(booking.createdAt)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<VisibilityIcon />}
                    onClick={() => {
                      setSelectedBooking(booking)
                      setViewDialogOpen(true)
                    }}
                    sx={{ color: theme.primary }}
                  >
                    View Details
                  </Button>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setSelectedBooking(booking)
                      setNewStatus(booking.status)
                      setStatusDialogOpen(true)
                    }}
                    sx={{ color: theme.warning }}
                  >
                    Edit Status
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setSelectedBooking(booking)
                      setDeleteDialogOpen(true)
                    }}
                    sx={{ color: theme.error }}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_event, page) => setCurrentPage(page)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* View Booking Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobileDialog}
      >
        <DialogTitle sx={{ background: theme.primary, color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <LocalShippingIcon />
            Booking Details
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedBooking && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color={theme.primary}>
                  Customer Information
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" color={theme.text.secondary}>
                    Name
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {selectedBooking.customerName || 'Unknown Customer'}
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color={theme.text.secondary}>
                    Customer ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedBooking.customerId}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color={theme.primary}>
                  Driver Information
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" color={theme.text.secondary}>
                    Driver
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {selectedBooking.driverName || 'Not Assigned'}
                  </Typography>
                </Box>
                {selectedBooking.driverId && (
                  <Box mb={2}>
                    <Typography variant="body2" color={theme.text.secondary}>
                      Verification Status
                    </Typography>
                    <Chip
                      label={selectedBooking.driverVerified ? 'Verified' : 'Unverified'}
                      color={selectedBooking.driverVerified ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color={theme.primary}>
                  Location Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box p={2} sx={{ background: theme.primary + '05', borderRadius: 2 }}>
                      <Typography variant="body2" color={theme.text.secondary} gutterBottom>
                        Pickup Location
                      </Typography>
                      <Typography variant="body1">
                        {selectedBooking.pickupLocation?.address || 'No pickup address'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box p={2} sx={{ background: theme.primary + '05', borderRadius: 2 }}>
                      <Typography variant="body2" color={theme.text.secondary} gutterBottom>
                        Dropoff Location
                      </Typography>
                      <Typography variant="body1">
                        {selectedBooking.dropoffLocation?.address || 'No dropoff address'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Contact Information Section */}
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom color={theme.primary}>
                    Contact Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box p={2} sx={{ background: theme.primary + '05', borderRadius: 2 }}>
                        <Typography variant="body2" color={theme.text.secondary} gutterBottom>
                          Sender (Pickup Contact)
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          {selectedBooking.senderInfo?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color={theme.text.secondary}>
                          {selectedBooking.senderInfo?.phone || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box p={2} sx={{ background: theme.primary + '05', borderRadius: 2 }}>
                        <Typography variant="body2" color={theme.text.secondary} gutterBottom>
                          Recipient (Dropoff Contact)
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          {selectedBooking.recipientInfo?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color={theme.text.secondary}>
                          {selectedBooking.recipientInfo?.phone || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                {/* Photo Verification Section */}
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom color={theme.primary}>
                    Photo Verification
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box p={2} sx={{ background: theme.primary + '05', borderRadius: 2 }}>
                        <Typography variant="body2" color={theme.text.secondary} gutterBottom>
                          Pickup Verification
                        </Typography>
                        {selectedBooking.pickupVerification && selectedBooking.pickupVerification.photoUrl ? (
                          <Box>
                            <Box mb={1}>
                              <img 
                                src={selectedBooking.pickupVerification.photoUrl} 
                                alt="Pickup verification" 
                                style={{ 
                                  width: '100%', 
                                  maxWidth: '200px', 
                                  height: '150px', 
                                  objectFit: 'cover', 
                                  borderRadius: '8px' 
                                }}
                                onError={(e) => {
                                  console.error('❌ Failed to load pickup verification image:', selectedBooking.pickupVerification?.photoUrl);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color={theme.text.secondary}>
                              Verified: {selectedBooking.pickupVerification.verifiedAt ? new Date(selectedBooking.pickupVerification.verifiedAt).toLocaleString() : 'N/A'}
                            </Typography>
                            <Typography variant="body2" color={theme.text.secondary}>
                              By: {selectedBooking.pickupVerification.verifiedBy || 'Driver'}
                            </Typography>
                            {selectedBooking.pickupVerification.notes && (
                              <Typography variant="body2" color={theme.text.secondary}>
                                Notes: {selectedBooking.pickupVerification.notes}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color={theme.text.secondary}>
                            No pickup verification photo
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box p={2} sx={{ background: theme.primary + '05', borderRadius: 2 }}>
                        <Typography variant="body2" color={theme.text.secondary} gutterBottom>
                          Delivery Verification
                        </Typography>
                        {selectedBooking.deliveryVerification && selectedBooking.deliveryVerification.photoUrl ? (
                          <Box>
                            <Box mb={1}>
                              <img 
                                src={selectedBooking.deliveryVerification.photoUrl} 
                                alt="Delivery verification" 
                                style={{ 
                                  width: '100%', 
                                  maxWidth: '200px', 
                                  height: '150px', 
                                  objectFit: 'cover', 
                                  borderRadius: '8px' 
                                }}
                                onError={(e) => {
                                  console.error('❌ Failed to load delivery verification image:', selectedBooking.deliveryVerification?.photoUrl);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color={theme.text.secondary}>
                              Verified: {selectedBooking.deliveryVerification.verifiedAt ? new Date(selectedBooking.deliveryVerification.verifiedAt).toLocaleString() : 'N/A'}
                            </Typography>
                            <Typography variant="body2" color={theme.text.secondary}>
                              By: {selectedBooking.deliveryVerification.verifiedBy || 'Driver'}
                            </Typography>
                            {selectedBooking.deliveryVerification.notes && (
                              <Typography variant="body2" color={theme.text.secondary}>
                                Notes: {selectedBooking.deliveryVerification.notes}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color={theme.text.secondary}>
                            No delivery verification photo
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color={theme.primary}>
                  Booking Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center" p={2} sx={{ background: theme.primary + '05', borderRadius: 2 }}>
                      <Typography variant="body2" color={theme.text.secondary}>
                        Status
                      </Typography>
                      <Chip
                        label={(selectedBooking.status || 'unknown').replace('_', ' ')}
                        sx={{
                          background: getStatusColor(selectedBooking.status || 'unknown'),
                          color: 'white',
                          fontWeight: 600,
                          mt: 1
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center" p={2} sx={{ background: theme.primary + '05', borderRadius: 2 }}>
                      <Typography variant="body2" color={theme.text.secondary}>
                        Fare
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color={theme.primary}>
                        ₹{selectedBooking.fare || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center" p={2} sx={{ background: theme.primary + '05', borderRadius: 2 }}>
                      <Typography variant="body2" color={theme.text.secondary}>
                        Payment
                      </Typography>
                      <Chip
                        label={selectedBooking.paymentStatus || 'pending'}
                        sx={{
                          background: getPaymentStatusColor(selectedBooking.paymentStatus || 'pending'),
                          color: 'white',
                          fontWeight: 600,
                          mt: 1
                        }}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center" p={2} sx={{ background: theme.primary + '05', borderRadius: 2 }}>
                      <Typography variant="body2" color={theme.text.secondary}>
                        Created
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        {formatTime(selectedBooking.createdAt)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobileDialog}
      >
        <DialogTitle sx={{ background: theme.primary, color: 'white' }}>
          Update Booking Status
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedBooking && (
            <Box>
              <Typography variant="body1" mb={2}>
                Update status for booking #{selectedBooking.id.substring(0, 8)}
              </Typography>
              <TextField
                fullWidth
                select
                label="Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                margin="normal"
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {(status || 'unknown').replace('_', ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleStatusUpdate}
            disabled={!newStatus || newStatus === selectedBooking?.status || isUpdating}
            sx={{ background: theme.primary }}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isUpdating && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobileDialog}
      >
        <DialogTitle sx={{ background: theme.error, color: 'white' }}>
          Delete Booking
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedBooking && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Warning</AlertTitle>
                This action cannot be undone. The booking will be permanently deleted.
              </Alert>
              <Typography variant="body1" mb={2}>
                Are you sure you want to delete booking #{selectedBooking.id.substring(0, 8)}?
              </Typography>
              <Typography variant="body2" color={theme.text.secondary} mb={2}>
                Customer: {selectedBooking.customerName || 'Unknown'}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason for deletion (optional)"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                margin="normal"
                placeholder="Enter reason for deleting this booking..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false)
              setDeleteReason('')
            }}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleDeleteBooking}
            disabled={isUpdating}
            sx={{ background: theme.error, '&:hover': { background: theme.error + 'dd' } }}
          >
            {isUpdating ? 'Deleting...' : 'Delete Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog
        open={showBulkActions}
        onClose={() => setShowBulkActions(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobileDialog}
      >
        <DialogTitle sx={{ background: theme.primary, color: 'white' }}>
          Bulk Actions
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box>
            <Typography variant="body1" mb={2}>
              Update status for {selectedBookings.length} selected bookings
            </Typography>
            <TextField
              fullWidth
              select
              label="New Status"
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              margin="normal"
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {(status || 'unknown').replace('_', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkActions(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleBulkAction}
            disabled={!bulkAction}
            sx={{ background: theme.primary }}
          >
            Update {selectedBookings.length} Bookings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobileDialog}
      >
        <DialogTitle sx={{ background: theme.success, color: 'white' }}>
          Export Bookings
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box>
            <Typography variant="body1" mb={2}>
              Export {filteredBookings.length} filtered bookings
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Export Format</InputLabel>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                label="Export Format"
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="xlsx">Excel</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleExport}
            sx={{ background: theme.success }}
          >
            Export Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
})

export default ModernBookingManagement
