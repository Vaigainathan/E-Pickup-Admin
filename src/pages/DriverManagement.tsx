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
  Paper,
  Pagination,
  Tooltip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Fade,
  Zoom,
  Skeleton,
  Stack,
  Badge,
  Divider,
  InputAdornment,
  useTheme,
  useMediaQuery,
  ClickAwayListener,
  alpha,
  styled,
  keyframes,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  Description as DescriptionIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Block as BlockIcon,
  Pending as PendingIcon,
  Timeline as TimelineIcon,
  DirectionsCar as CarIcon,
  TwoWheeler as BikeIcon,
  DirectionsBus as BusIcon,
  CloudDownload as CloudDownloadIcon,
  Settings as SettingsIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalShipping as DeliveryIcon,
  List as ListIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material'
import { comprehensiveAdminService } from '../services/comprehensiveAdminService'
import { realTimeService } from '../services/realTimeService'
import { apiService } from '../services/apiService'
import { AdminColors } from '../constants/Colors'

interface Driver {
  id: string
  uid?: string
  driverId?: string
  name?: string
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
    vehicleType: 'motorcycle' | 'electric'
    vehicleNumber: string
    vehicleMake: string
    vehicleModel: string
    vehicleYear: number
    vehicleColor: string
    licenseNumber: string
    licenseExpiry: string
    rcNumber: string
    insuranceNumber: string
    insuranceExpiry: string
  }
  documents: {
    drivingLicense?: {
      url?: string
      downloadURL?: string
      status?: string
      verificationStatus?: string
      verified?: boolean
      uploadedAt?: string
      expiryDate?: string
    }
    aadhaar?: {
      url?: string
      downloadURL?: string
      status?: string
      verificationStatus?: string
      verified?: boolean
      uploadedAt?: string
      expiryDate?: string
    }
    insurance?: {
      url?: string
      downloadURL?: string
      status?: string
      verificationStatus?: string
      verified?: boolean
      uploadedAt?: string
      expiryDate?: string
    }
    rcBook?: {
      url?: string
      downloadURL?: string
      status?: string
      verificationStatus?: string
      verified?: boolean
      uploadedAt?: string
      expiryDate?: string
    }
    profilePhoto?: {
      url?: string
      downloadURL?: string
      status?: string
      verificationStatus?: string
      verified?: boolean
      uploadedAt?: string
      expiryDate?: string
    }
  }
  location?: {
    latitude: number
    longitude: number
    address: string
    timestamp: string
  }
  isOnline?: boolean
  isAvailable?: boolean
  rating: number
  totalDeliveries?: number
  totalTrips?: number
  earnings?: {
    total: number
    thisMonth: number
    lastMonth: number
  }
  status: string
  isVerified?: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

// Styled Components
const StyledCard = styled(Card)(() => ({
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  borderRadius: 16,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
}))

const StyledMetricCard = styled(Card)(() => ({
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  borderRadius: 12,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
}))

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`

const PulseBadge = styled(Badge)(() => ({
  '& .MuiBadge-badge': {
    animation: `${pulseAnimation} 2s infinite`,
  },
}))

const ModernDriverManagement: React.FC = React.memo(() => {
  // const navigate = useNavigate() // Removed unused variable
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Core states
  const [isInitialized, setIsInitialized] = useState(false)
  // const [isLoading, setIsLoading] = useState(true) // Removed unused variable
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isConnected, setIsConnected] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [currentDocumentType, setCurrentDocumentType] = useState<string>('')

  // Data states
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [pendingVerifications, setPendingVerifications] = useState<Driver[]>([])
  const [onlineDrivers, setOnlineDrivers] = useState<Driver[]>([])
  const [blockedDrivers, setBlockedDrivers] = useState<Driver[]>([])
  // const [recentDrivers, setRecentDrivers] = useState<Driver[]>([]) // Removed unused variable

  // Loading states
  const [driversLoading, setDriversLoading] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // UI states
  // const [selectedTab, setSelectedTab] = useState(0) // Removed unused variables
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [sortBy] = useState('name') // Removed unused setter
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showFilters, setShowFilters] = useState(false)
  // const [expandedDriver, setExpandedDriver] = useState<string | null>(null) // Removed unused variables
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  // const [dateRangeFilter, setDateRangeFilter] = useState('all') // Removed unused variables

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12) // Removed unused setter
  const [totalPages, setTotalPages] = useState(1)

  // Dialog states
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false)
  // const [editDialogOpen, setEditDialogOpen] = useState(false) // Removed unused variables
  // const [blockDialogOpen, setBlockDialogOpen] = useState(false) // Removed unused variables
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [actionReason, setActionReason] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<'approved' | 'rejected'>('approved')
  // const [blockReason, setBlockReason] = useState('') // Removed unused variables
  
  // Document states
  const [driverDocuments, setDriverDocuments] = useState<any>(null)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentVerificationNotes, setDocumentVerificationNotes] = useState('')
  
  // Actions menu state
  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(null)
  // const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null) // Removed unused variables

  // Real-time states
  const [realTimeEnabled] = useState(true) // Removed unused setter
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  // Speed dial state
  const [speedDialOpen, setSpeedDialOpen] = useState(false)

  // Initialize service with enhanced real-time capabilities
  useEffect(() => {
    const initializeService = async (): Promise<void> => {
      try {
        console.log('🔄 Initializing Modern Driver Management Service...')
        await comprehensiveAdminService.initialize()
        
        // Setup real-time listeners
        comprehensiveAdminService.setupRealTimeListeners()
        
        // Initialize real-time service
        realTimeService.subscribeToDriverUpdates('admin_drivers')
        
        setIsInitialized(true)
        setIsConnected(true)
        console.log('✅ Modern Driver Management Service initialized successfully')
        
        // Setup enhanced real-time event listeners
        const handleDriverUpdate = (event: CustomEvent) => {
          console.log('📱 Driver update received:', event.detail)
          if (realTimeEnabled) {
            fetchDrivers()
          }
        }
        
        const handleDriverVerification = (event: CustomEvent) => {
          console.log('✅ Driver verification update received:', event.detail)
          if (realTimeEnabled) {
            fetchDrivers()
          }
        }
        
        const handleDriverStatusChange = (event: CustomEvent) => {
          console.log('🔄 Driver status change received:', event.detail)
          if (realTimeEnabled) {
            fetchDrivers()
          }
        }
        
        // Add event listeners
        window.addEventListener('driverUpdate', handleDriverUpdate as any)
        window.addEventListener('driverVerification', handleDriverVerification as any)
        window.addEventListener('driverStatusChange', handleDriverStatusChange as any)
        
      } catch (error) {
        console.error('❌ Failed to initialize Modern Driver Management Service:', error)
        setError('Failed to initialize driver management service. Please refresh the page.')
        setIsConnected(false)
      }
    }

    initializeService()
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions...')
      // Cleanup is handled by useEffect
      comprehensiveAdminService.cleanup()
      realTimeService.disconnect()
    }
  }, [realTimeEnabled])

  // Enhanced fetch drivers with real-time data processing and error handling
  const fetchDrivers = useCallback(async () => {
    const startTime = performance.now()
    try {
      setDriversLoading(true)
      setError(null)
      console.log('🔄 Fetching drivers with enhanced processing...')
      
      const response = await comprehensiveAdminService.getDrivers()
      
      if (response.success && response.data) {
        const driversData = (response.data as any[]).map((driver: any) => ({
          ...driver,
          // Ensure proper data structure with validation
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
          // CRITICAL FIX: Add vehicleDetails mapping for admin dashboard display
          vehicleDetails: driver?.driver?.vehicleDetails || driver?.vehicleDetails || {
            vehicleType: driver?.vehicleInfo?.make || 'motorcycle',
            vehicleNumber: driver?.vehicleInfo?.plateNumber || 'Not provided',
            vehicleMake: driver?.vehicleInfo?.make || 'Not provided',
            vehicleModel: driver?.vehicleInfo?.model || 'Not provided',
            vehicleYear: driver?.vehicleInfo?.year || new Date().getFullYear(),
            vehicleColor: driver?.vehicleInfo?.color || 'Not provided',
            licenseNumber: driver?.driver?.vehicleDetails?.licenseNumber || 'Not provided',
            licenseExpiry: driver?.driver?.vehicleDetails?.licenseExpiry || 'Not provided',
            rcNumber: driver?.driver?.vehicleDetails?.rcNumber || 'Not provided',
            insuranceNumber: driver?.driver?.vehicleDetails?.insuranceNumber || 'Not provided',
            insuranceExpiry: driver?.driver?.vehicleDetails?.insuranceExpiry || 'Not provided'
          },
          // CRITICAL FIX: Enhanced verification status calculation
          isVerified: (() => {
            // Check multiple verification status indicators
            const driverVerificationStatus = driver?.driver?.verificationStatus || driver?.verificationStatus
            const userIsVerified = driver?.driver?.isVerified || driver?.isVerified
            
            // Check if all required documents are verified
            const documents = driver?.documents || {}
            const requiredDocTypes = ['drivingLicense', 'aadhaar', 'insurance', 'rcBook', 'profilePhoto']
            let verifiedDocs = 0
            let totalDocs = 0
            
            requiredDocTypes.forEach(docType => {
              const doc = documents[docType as keyof Driver['documents']]
              if (doc && (doc.url || doc.downloadURL)) {
                totalDocs++
                const isVerified = doc.verified === true || 
                                  doc.status === 'verified' || 
                                  doc.verificationStatus === 'verified'
                if (isVerified) {
                  verifiedDocs++
                }
              }
            })
            
            // Driver is verified if:
            // 1. Explicitly marked as verified/approved, OR
            // 2. All documents are verified
            const allDocsVerified = totalDocs > 0 && verifiedDocs === totalDocs
            const isExplicitlyVerified = driverVerificationStatus === 'verified' || 
                                       driverVerificationStatus === 'approved' || 
                                       userIsVerified === true
            
            console.log('🔍 Verification status calculation:', {
              driverId: driver?.id,
              driverVerificationStatus,
              userIsVerified,
              verifiedDocs,
              totalDocs,
              allDocsVerified,
              isExplicitlyVerified,
              finalStatus: isExplicitlyVerified || allDocsVerified
            })
            
            return isExplicitlyVerified || allDocsVerified
          })(),
          status: (() => {
            const driverVerificationStatus = driver?.driver?.verificationStatus || driver?.verificationStatus
            const documents = driver?.documents || {}
            const requiredDocTypes = ['drivingLicense', 'aadhaar', 'insurance', 'rcBook', 'profilePhoto']
            let verifiedDocs = 0
            let totalDocs = 0
            
            requiredDocTypes.forEach(docType => {
              const doc = documents[docType as keyof Driver['documents']]
              if (doc && (doc.url || doc.downloadURL)) {
                totalDocs++
                const isVerified = doc.verified === true || 
                                  doc.status === 'verified' || 
                                  doc.verificationStatus === 'verified'
                if (isVerified) {
                  verifiedDocs++
                }
              }
            })
            
            // Determine status based on verification state
            if (driverVerificationStatus === 'verified' || driverVerificationStatus === 'approved') {
              return 'verified'
            } else if (driverVerificationStatus === 'rejected') {
              return 'rejected'
            } else if (totalDocs > 0 && verifiedDocs === totalDocs) {
              return 'verified'
            } else if (totalDocs > 0 && verifiedDocs > 0) {
              return 'pending_verification'
            } else {
              return 'pending'
            }
          })(),
          isOnline: driver?.isOnline || false,
          isAvailable: driver?.isAvailable || false,
          rating: Math.max(0, Math.min(5, driver?.rating || 0)), // Clamp rating between 0-5
          totalTrips: Math.max(0, driver?.totalTrips || 0), // Ensure non-negative
          earnings: {
            total: Math.max(0, driver?.earnings?.total || 0),
            thisMonth: Math.max(0, driver?.earnings?.thisMonth || 0),
            lastMonth: Math.max(0, driver?.earnings?.lastMonth || 0)
          },
          documents: driver?.documents || {},
          createdAt: driver?.createdAt || new Date().toISOString()
        }))
        
        setDrivers(driversData)
        
        // Categorize drivers with error handling
        const pending = driversData.filter(driver => !driver.isVerified)
        const online = driversData.filter(driver => driver.isOnline && driver.isActive)
        const blocked = driversData.filter(driver => driver.status === 'blocked' || driver.status === 'suspended')
        // const recent = driversData
        //   .filter(driver => driver.createdAt)
        //   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        //   .slice(0, 5)
        
        setPendingVerifications(pending)
        setOnlineDrivers(online)
        setBlockedDrivers(blocked)
        // setRecentDrivers(recent) // Removed unused function call
        setNotificationCount(pending.length)
        
        // Calculate pagination with validation
        setTotalPages(Math.max(1, Math.ceil(driversData.length / itemsPerPage)))
        
        setIsConnected(true)
        setLastUpdated(new Date())
        setLastRefreshTime(new Date())
        setRetryCount(0) // Reset retry count on success
        const endTime = performance.now()
        console.log(`✅ Drivers fetched and processed successfully: ${driversData.length} drivers in ${(endTime - startTime).toFixed(2)}ms`)
      } else {
        console.error('❌ Failed to fetch drivers:', response.error)
        setError(`Failed to fetch drivers: ${response.error || 'Unknown error'}`)
        setIsConnected(false)
        
        // Set enhanced mock data for demonstration
        const mockDrivers = [
          {
            id: 'driver-1',
            personalInfo: { name: 'John Smith', email: 'john@example.com', phone: '+1234567890' },
            vehicleInfo: { make: 'Honda', model: 'Civic', year: 2020, color: 'Blue', plateNumber: 'ABC123' },
            isActive: true,
            isVerified: true,
            isOnline: true,
            isAvailable: true,
            status: 'verified',
            rating: 4.8,
            totalTrips: 150,
            earnings: { total: 12500, thisMonth: 2500, lastMonth: 3000 },
            documents: {
              license: { url: '', status: 'verified', verified: true },
              insurance: { url: '', status: 'verified', verified: true },
              registration: { url: '', status: 'verified', verified: true }
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
          },
          {
            id: 'driver-2',
            personalInfo: { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1234567891' },
            vehicleInfo: { make: 'Toyota', model: 'Camry', year: 2019, color: 'Red', plateNumber: 'XYZ789' },
            isActive: true,
            isVerified: false,
            isOnline: false,
            isAvailable: false,
            status: 'pending',
            rating: 0,
            totalTrips: 0,
            earnings: { total: 0, thisMonth: 0, lastMonth: 0 },
            documents: {
              license: { url: '', status: 'pending', verified: false },
              insurance: { url: '', status: 'pending', verified: false }
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
          },
          {
            id: 'driver-3',
            personalInfo: { name: 'Mike Wilson', email: 'mike@example.com', phone: '+1234567892' },
            vehicleInfo: { make: 'Suzuki', model: 'Swift', year: 2021, color: 'White', plateNumber: 'DEF456' },
            isActive: true,
            isVerified: true,
            isOnline: true,
            isAvailable: false,
            status: 'verified',
            rating: 4.2,
            totalTrips: 89,
            earnings: { total: 8900, thisMonth: 1800, lastMonth: 2200 },
            documents: {
              license: { url: '', status: 'verified', verified: true },
              insurance: { url: '', status: 'verified', verified: true },
              registration: { url: '', status: 'verified', verified: true }
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
          }
        ]
        setDrivers(mockDrivers)
        setPendingVerifications(mockDrivers.filter(d => !d.isVerified))
        setOnlineDrivers(mockDrivers.filter(d => d.isOnline))
        setBlockedDrivers(mockDrivers.filter(d => d.status === 'blocked'))
        setNotificationCount(mockDrivers.filter(d => !d.isVerified).length)
        setTotalPages(Math.max(1, Math.ceil(mockDrivers.length / itemsPerPage)))
        console.log('⚠️ Using mock driver data for demonstration')
      }
    } catch (error) {
      console.error('❌ Error fetching drivers:', error)
      setError(`Failed to fetch drivers data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsConnected(false)
      setRetryCount(prev => prev + 1)
    } finally {
      setDriversLoading(false)
    }
  }, [itemsPerPage])

  // Initial data fetch
  useEffect(() => {
    if (isInitialized) {
      fetchDrivers()
    }
  }, [isInitialized, fetchDrivers])

  // Auto-refresh every 2 minutes with performance optimization
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(() => {
      // Only refresh if not currently loading and no active user interactions
      if (!driversLoading && !isRefreshing) {
        fetchDrivers()
      }
    }, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isInitialized, driversLoading, isRefreshing]) // Add dependencies for better performance

  // Debounced search for better performance with input validation
  useEffect(() => {
    const timer = setTimeout(() => {
      // Sanitize and validate search query
      const sanitizedQuery = searchQuery.trim().replace(/[<>]/g, '')
      setDebouncedSearchQuery(sanitizedQuery)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, statusFilter, verificationFilter, vehicleTypeFilter, ratingFilter])

  // Handle driver verification
  const handleVerifyDriver = useCallback(async () => {
    if (!selectedDriver) return

    try {
      setVerificationLoading(true)
      console.log('🔄 Verifying driver...', { driverId: selectedDriver.id, status: verificationStatus })
      
      let response
      if (verificationStatus === 'approved') {
        response = await comprehensiveAdminService.approveDriver(
          selectedDriver.id,
          'Driver approved by admin'
        )
      } else {
        response = await comprehensiveAdminService.rejectDriver(
          selectedDriver.id,
          rejectionReason || 'Driver rejected by admin'
        )
      }
      
      if (response.success) {
        console.log('✅ Driver verification successful')
        setVerifyDialogOpen(false)
        setSelectedDriver(null)
        setRejectionReason('')
        
        // Refresh drivers data
        await fetchDrivers()
      } else {
        console.error('❌ Failed to verify driver:', response.error)
        setError('Failed to verify driver')
      }
    } catch (error) {
      console.error('❌ Error verifying driver:', error)
      setError('Failed to verify driver')
    } finally {
      setVerificationLoading(false)
    }
  }, [selectedDriver, verificationStatus, rejectionReason, fetchDrivers])

  // Handle page change
  const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }, [])

  // Handle refresh with retry mechanism
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    fetchDrivers().finally(() => {
      setIsRefreshing(false)
    })
  }, [fetchDrivers])

  // Handle retry with exponential backoff
  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff: 1s, 2s, 4s
      setTimeout(() => {
        fetchDrivers()
      }, delay)
    } else {
      setError('Maximum retry attempts reached. Please refresh the page.')
    }
  }, [retryCount, fetchDrivers])

  // Enhanced filtering and search
  const filteredDrivers = useMemo(() => {
    let filtered = drivers

    // Apply debounced search query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(driver => 
        (driver.personalInfo?.name || driver.name || '').toLowerCase().includes(query) ||
        (driver.personalInfo?.phone || '').includes(query) ||
        (driver.personalInfo?.email || '').toLowerCase().includes(query) ||
        (driver.vehicleInfo?.make || '').toLowerCase().includes(query) ||
        (driver.vehicleInfo?.model || '').toLowerCase().includes(query) ||
        (driver.vehicleInfo?.plateNumber || '').toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(driver => driver.status === statusFilter)
    }

    // Apply verification filter
    if (verificationFilter !== 'all') {
      if (verificationFilter === 'verified') {
        filtered = filtered.filter(driver => driver.isVerified)
      } else if (verificationFilter === 'pending') {
        filtered = filtered.filter(driver => !driver.isVerified)
      }
    }

    // Apply vehicle type filter
    if (vehicleTypeFilter !== 'all') {
      filtered = filtered.filter(driver => 
        (driver.vehicleInfo?.make || '').toLowerCase().includes(vehicleTypeFilter.toLowerCase())
      )
    }

    // Apply rating filter
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter)
      filtered = filtered.filter(driver => (driver.rating || 0) >= minRating)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = (a.personalInfo?.name || a.name || '').toLowerCase()
          bValue = (b.personalInfo?.name || b.name || '').toLowerCase()
          break
        case 'rating':
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        case 'trips':
          aValue = a.totalTrips || 0
          bValue = b.totalTrips || 0
          break
        case 'earnings':
          aValue = a.earnings?.total || 0
          bValue = b.earnings?.total || 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime()
          bValue = new Date(b.createdAt || 0).getTime()
          break
        default:
          aValue = (a.personalInfo?.name || a.name || '').toLowerCase()
          bValue = (b.personalInfo?.name || b.name || '').toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [drivers, debouncedSearchQuery, statusFilter, verificationFilter, vehicleTypeFilter, ratingFilter, sortBy, sortOrder])

  // Memoized paginated drivers
  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredDrivers.slice(startIndex, endIndex)
  }, [filteredDrivers, currentPage, itemsPerPage])

  // Enhanced utility functions
  // const getStatusColor = useCallback((status: string) => { // Removed unused function
  //   switch (status) {
  //     case 'verified': return 'success'
  //     case 'pending': return 'warning'
  //     case 'pending_verification': return 'warning'
  //     case 'rejected': return 'error'
  //     case 'suspended': return 'error'
  //     case 'blocked': return 'error'
  //     case 'active': return 'success'
  //     case 'inactive': return 'default'
  //     default: return 'default'
  //   }
  // }, [])

  // Sync all drivers verification status
  const handleSyncAllDrivers = useCallback(async () => {
    try {
      // setIsLoading(true) // Removed unused function call
      console.log('🔄 Syncing all drivers verification status...')
      
      const response = await comprehensiveAdminService.syncAllDriversStatus()
      
      if (response.success) {
        console.log('✅ All drivers status synced successfully')
        setSuccess('All drivers verification status synchronized successfully')
        
        // Refresh the drivers list
        await fetchDrivers()
      } else {
        console.error('❌ Sync failed:', response.error)
        setError(response.error?.message || 'Failed to sync drivers status')
      }
    } catch (error) {
      console.error('❌ Sync error:', error)
      setError('Failed to sync drivers status')
    } finally {
      // setIsLoading(false) // Removed unused function call
    }
  }, [fetchDrivers])

  const getDocumentStatus = useCallback((documents: Driver['documents']) => {
    if (!documents || typeof documents !== 'object' || documents === null) return '0/0'
    try {
      // CRITICAL FIX: Properly count verified documents
      const requiredDocTypes = ['drivingLicense', 'aadhaar', 'insurance', 'rcBook', 'profilePhoto']
      let totalDocs = 0
      let verifiedDocs = 0
      
      requiredDocTypes.forEach(docType => {
        const doc = documents[docType as keyof Driver['documents']]
        if (doc && (doc.url || doc.downloadURL)) {
          totalDocs++
          // Check multiple verification indicators
          const isVerified = doc.verified === true || 
                            doc.status === 'verified' || 
                            doc.verificationStatus === 'verified'
          if (isVerified) {
            verifiedDocs++
          }
        }
      })
      
      console.log('📊 Document status calculation:', {
        totalDocs,
        verifiedDocs,
        documents: Object.keys(documents),
        docDetails: Object.entries(documents).map(([key, doc]) => ({
          type: key,
          hasUrl: !!(doc?.url || doc?.downloadURL),
          verified: doc?.verified,
          status: doc?.status,
          verificationStatus: doc?.verificationStatus
        }))
      })
      
      return `${verifiedDocs}/${totalDocs}`
    } catch (error) {
      console.error('Error in getDocumentStatus:', error)
      return '0/0'
    }
  }, [])

  const getOnlineStatus = useCallback((driver: Driver) => {
    if (driver.isOnline && driver.isAvailable) return { status: 'Online', color: 'success' }
    if (driver.isOnline && !driver.isAvailable) return { status: 'Busy', color: 'warning' }
    return { status: 'Offline', color: 'default' }
  }, [])

  const getVehicleIcon = useCallback((make: string) => {
    const makeLower = make.toLowerCase()
    if (makeLower.includes('bike') || makeLower.includes('motorcycle')) return <BikeIcon />
    if (makeLower.includes('truck') || makeLower.includes('van')) return <DeliveryIcon />
    if (makeLower.includes('bus')) return <BusIcon />
    return <CarIcon />
  }, [])

  const formatEarnings = useCallback((earnings: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(earnings)
  }, [])

  const getRatingStars = useCallback((rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIcon key={i} sx={{ fontSize: 16, color: '#ffc107' }} />)
    }
    
    if (hasHalfStar) {
      stars.push(<StarIcon key="half" sx={{ fontSize: 16, color: '#ffc107' }} />)
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarBorderIcon key={`empty-${i}`} sx={{ fontSize: 16, color: '#e0e0e0' }} />)
    }
    
    return stars
  }, [])

  // Enhanced memoized driver card component
  const DriverCard = React.memo(({ driver, index }: { driver: Driver; index: number }) => (
    <Zoom in={true} timeout={300 + index * 100}>
      <Card 
        sx={{ 
          height: '100%',
          minHeight: 280,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 3,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
            borderColor: AdminColors.primary,
          },
          '&:focus': {
            outline: `2px solid ${AdminColors.primary}`,
            outlineOffset: 2,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${AdminColors.primary} 0%, ${AdminColors.secondary} 100%)`,
          }
        }}
        onClick={() => {
          setSelectedDriver(driver);
          setViewDialogOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedDriver(driver);
            setViewDialogOpen(true);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`View details for driver ${driver.personalInfo?.name || driver.name || 'Unknown'}`}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header with Avatar and Actions */}
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar 
              sx={{ 
                mr: 2, 
                width: 60, 
                height: 60,
                bgcolor: AdminColors.primary,
                fontSize: '1.75rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '3px solid white'
              }}
            >
              {(driver.personalInfo?.name || driver.name || 'D').charAt(0).toUpperCase()}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography 
                variant="h6" 
                fontWeight="700" 
                sx={{ 
                  color: AdminColors.primary,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {driver.personalInfo?.name || driver.name || 'Unknown Driver'}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                sx={{ 
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {driver.personalInfo?.phone || 'N/A'}
              </Typography>
            </Box>
            <Tooltip title="Actions" arrow>
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenActions(e, driver);
                }}
                aria-label={`Actions for ${driver.personalInfo?.name || driver.name || 'Unknown'}`}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  '&:hover': {
                    bgcolor: 'rgba(5, 1, 91, 0.08)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Status Chips */}
          <Box display="flex" alignItems="center" gap={1} mb={3} flexWrap="wrap">
            <Chip
              label={driver.isVerified ? 'Verified' : 'Pending'}
              color={driver.isVerified ? 'success' : 'warning'}
              size="small"
              sx={{ 
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                '& .MuiChip-label': {
                  px: 1.5
                }
              }}
            />
            <Chip
              label={getOnlineStatus(driver).status}
              color={getOnlineStatus(driver).color as any}
              size="small"
              variant="outlined"
              sx={{ 
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 24,
                '& .MuiChip-label': {
                  px: 1.5
                }
              }}
            />
          </Box>

          {/* Rating and Stats */}
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box display="flex" alignItems="center" gap={0.5}>
              {getRatingStars(driver.rating)}
              <Typography 
                variant="body2" 
                sx={{ 
                  ml: 0.5,
                  fontWeight: 600,
                  color: AdminColors.primary
                }}
              >
                {driver.rating?.toFixed(1) || '0.0'}
              </Typography>
            </Box>
            <Box 
              sx={{ 
                width: 1, 
                height: 16, 
                bgcolor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: 0.5
              }} 
            />
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ fontSize: '0.875rem' }}
            >
              {driver.totalTrips || 0} trips
            </Typography>
          </Box>

          {/* Vehicle Information */}
          <Box 
            sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.02)',
              borderRadius: 2,
              p: 2,
              mb: 3
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              {getVehicleIcon(driver.vehicleDetails?.vehicleType || driver.vehicleInfo?.make || '')}
              <Typography 
                variant="body2" 
                fontWeight="600"
                sx={{ 
                  color: AdminColors.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {driver.vehicleDetails?.vehicleMake || driver.vehicleInfo?.make} {driver.vehicleDetails?.vehicleModel || driver.vehicleInfo?.model}
              </Typography>
            </Box>
            <Typography 
              variant="caption" 
              color="textSecondary"
              sx={{ 
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                bgcolor: 'rgba(0, 0, 0, 0.05)',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                display: 'inline-block'
              }}
            >
              {driver.vehicleDetails?.vehicleNumber || driver.vehicleInfo?.plateNumber || 'N/A'}
            </Typography>
            {driver.vehicleDetails && (
              <Box mt={1}>
                <Typography 
                  variant="caption" 
                  color="textSecondary"
                  sx={{ fontSize: '0.7rem' }}
                >
                  Type: {driver.vehicleDetails.vehicleType} | Year: {driver.vehicleDetails.vehicleYear}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Footer with Earnings and Documents */}
          <Box 
            sx={{ 
              mt: 'auto',
              pt: 2,
              borderTop: '1px solid rgba(0, 0, 0, 0.08)'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography 
                variant="h6" 
                color={AdminColors.primary} 
                fontWeight="700"
                sx={{ fontSize: '1.1rem' }}
              >
                {formatEarnings(driver.earnings?.total || 0)}
              </Typography>
              <Box 
                sx={{ 
                  bgcolor: AdminColors.primary,
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {getDocumentStatus(driver.documents)}
              </Box>
            </Box>
            <Typography 
              variant="caption" 
              color="textSecondary"
              sx={{ fontSize: '0.75rem' }}
            >
              Total Earnings
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  ))

  DriverCard.displayName = 'DriverCard'

  // Actions menu handlers
  const handleOpenActions = useCallback((event: React.MouseEvent<HTMLElement>, driver: Driver) => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedDriver(driver)
    setActionsAnchorEl(event.currentTarget)
  }, [])

  const handleCloseActions = useCallback(() => {
    setActionsAnchorEl(null)
  }, [])

  const handleDeleteDriver = useCallback(() => {
    setDeleteDialogOpen(true)
    handleCloseActions()
  }, [handleCloseActions])

  const handleBanDriver = useCallback(() => {
    setBanDialogOpen(true)
    handleCloseActions()
  }, [handleCloseActions])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedDriver) return

    try {
      const response = await comprehensiveAdminService.deleteDriver(selectedDriver.id)
      
      if (response.success) {
        await fetchDrivers()
        setDeleteDialogOpen(false)
        setSelectedDriver(null)
      } else {
        setError(response.error?.message || 'Failed to delete driver')
      }
    } catch (err) {
      setError('Failed to delete driver')
      console.error('Error deleting driver:', err)
    }
  }, [selectedDriver, fetchDrivers])

  const handleConfirmBan = useCallback(async () => {
    if (!selectedDriver) return

    try {
      const response = await comprehensiveAdminService.banDriver(selectedDriver.id, actionReason)
      
      if (response.success) {
        await fetchDrivers()
        setBanDialogOpen(false)
        setSelectedDriver(null)
        setActionReason('')
      } else {
        setError(response.error?.message || 'Failed to ban driver')
      }
    } catch (err) {
      setError('Failed to ban driver')
      console.error('Error banning driver:', err)
    }
  }, [selectedDriver, actionReason, fetchDrivers])

  const handleViewDocuments = useCallback(async () => {
    if (selectedDriver) {
      setDocumentsLoading(true)
      setDocumentsDialogOpen(true)
      handleCloseActions()
      
      try {
        console.log(`📄 Discovering all documents for driver: ${selectedDriver.id}`)
        const response = await comprehensiveAdminService.discoverAllDriverDocuments(selectedDriver.id)
        
        if (response.success && response.data) {
          setDriverDocuments(response.data)
          console.log('✅ All documents discovered successfully:', response.data)
        } else {
          console.error('❌ Failed to discover documents:', response.error)
          setError(response.error?.message || 'Failed to discover driver documents')
        }
      } catch (error) {
        console.error('❌ Error discovering documents:', error)
        setError('Failed to discover driver documents')
      } finally {
        setDocumentsLoading(false)
      }
    }
  }, [selectedDriver, handleCloseActions])

  const handleDebugDocuments = useCallback(async () => {
    if (selectedDriver) {
      try {
        console.log(`🔍 Debug: Checking document flow for driver: ${selectedDriver.id}`)
        const response = await comprehensiveAdminService.debugDriverDocuments(selectedDriver.id)
        
        if (response.success && response.data) {
          console.log('🔍 Debug information:', response.data)
          alert(`Debug info logged to console. Check browser console for details.\n\nDriver: ${response.data.driverName}\nVerification Status: ${response.data.verificationStatus}\nUser Documents: ${Object.keys(response.data.userCollectionDocuments).length} found\nVerification Requests: ${response.data.verificationRequests.length} found\nDriver Documents: ${response.data.driverDocumentsCollection.length} found`)
        } else {
          console.error('❌ Debug failed:', response.error)
          setError(response.error?.message || 'Debug failed')
        }
      } catch (error) {
        console.error('❌ Debug error:', error)
        setError('Debug failed')
      }
    }
  }, [selectedDriver])

  const handleTestVerificationFlow = useCallback(async () => {
    if (selectedDriver) {
      try {
        console.log(`🧪 Testing verification flow for driver: ${selectedDriver.id}`)
        const response = await apiService.post(`/api/admin/test-verification-flow/${selectedDriver.id}`)
        
        if (response.success && response.data) {
          console.log('🧪 Test results:', response.data)
          const testData = response.data as any
          const passedTests = testData.documentTests?.filter((test: any) => test.verificationTest === 'PASS').length || 0
          const totalTests = testData.documentTests?.length || 0
          
          alert(`Verification Flow Test Results:\n\nDriver: ${testData.driverName || 'Unknown'}\nCurrent Status: ${testData.currentStatus || 'Unknown'}\nDocuments Found: ${testData.documentsFound || 0}\nVerification Requests: ${testData.verificationRequests || 0}\n\nDocument Tests: ${passedTests}/${totalTests} passed\nOverall Verification: ${testData.overallVerificationTest || 'Unknown'}\nStatus Sync: ${testData.statusSyncTest || 'Unknown'}\n\nCheck console for detailed results.`)
        } else {
          console.error('❌ Test failed:', response.error)
          setError(response.error?.message || 'Test failed')
        }
      } catch (error) {
        console.error('❌ Test error:', error)
        setError('Test failed')
      }
    }
  }, [selectedDriver])

  const handleTestDocumentAccess = useCallback(async () => {
    if (selectedDriver) {
      try {
        console.log(`🔍 Testing document access for driver: ${selectedDriver.id}`)
        const response = await comprehensiveAdminService.testDocumentAccess(selectedDriver.id)
        
        if (response.success && response.data) {
          console.log('🔍 Document access test results:', response.data)
          const testData = response.data
          const accessibleDocs = testData.summary?.accessibleDocuments || 0
          const totalDocs = testData.summary?.totalDocuments || 0
          
          alert(`Document Access Test Results:\n\nDriver: ${testData.driverName}\nTotal Documents: ${totalDocs}\nAccessible: ${accessibleDocs}\nInaccessible: ${totalDocs - accessibleDocs}\n\nCheck console for detailed results.`)
        } else {
          console.error('❌ Document access test failed:', response.error)
          setError(response.error?.message || 'Document access test failed')
        }
      } catch (error) {
        console.error('❌ Document access test error:', error)
        setError('Document access test failed')
      }
    }
  }, [selectedDriver])


  const handleViewDetails = useCallback(() => {
    setViewDialogOpen(true)
    handleCloseActions()
  }, [handleCloseActions])

  // Handle document verification
  const handleVerifyDocument = useCallback(async (documentType: string, status: 'verified' | 'rejected', rejectionReason?: string) => {
    if (!selectedDriver) return

    // Validation
    if (!documentType) {
      setError('Document type is required')
      return
    }
    
    if (status === 'rejected' && !rejectionReason?.trim()) {
      setError('Rejection reason is required when rejecting a document')
      return
    }

    try {
      setActionLoading(`verify-${documentType}`)
      console.log(`🔄 Verifying document: ${documentType} for driver: ${selectedDriver.id}`)
      
      // Map document types to backend expected format
      const documentTypeMap: { [key: string]: string } = {
        'drivingLicense': 'drivingLicense',
        'aadhaar': 'aadhaarCard',
        'aadhaarCard': 'aadhaarCard',
        'insurance': 'bikeInsurance',
        'bikeInsurance': 'bikeInsurance', 
        'rcBook': 'rcBook',
        'profilePhoto': 'profilePhoto'
      }
      
      const mappedDocumentType = documentTypeMap[documentType] || documentType
      
      // Prepare verification data with rejection reason
      // const verificationData = { // Removed unused variable
      //   status,
      //   notes: documentVerificationNotes,
      //   rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      //   verifiedAt: new Date().toISOString(),
      //   verifiedBy: 'admin' // You can get this from auth context
      // }
      
      console.log(`📤 Sending verification request to: /api/admin/drivers/${selectedDriver.id}/documents/${mappedDocumentType}/verify`)
      console.log(`📤 Request payload:`, {
        status,
        comments: documentVerificationNotes,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined
      })
      
      const response = await apiService.post(
        `/api/admin/drivers/${selectedDriver.id}/documents/${mappedDocumentType}/verify`,
        {
          status,
          comments: documentVerificationNotes,
          rejectionReason: status === 'rejected' ? rejectionReason : undefined
        }
      )
      
      console.log(`📥 Verification response:`, response)
      
      if (response.success) {
        console.log(`✅ Document ${documentType} ${status} successfully`)
        
        // CRITICAL FIX: Sync driver verification status after document verification
        try {
          console.log('🔄 Syncing driver verification status...')
          const syncResponse = await comprehensiveAdminService.syncAllDriversStatus()
          if (syncResponse.success) {
            console.log('✅ Driver verification status synced successfully')
          } else {
            console.warn('⚠️ Failed to sync driver status:', syncResponse.error)
          }
        } catch (syncError) {
          console.warn('⚠️ Error syncing driver status:', syncError)
        }
        
        // Show success message
        setSuccess(`Document ${documentType} ${status} successfully`)
        
        // Refresh documents and driver list
        await handleViewDocuments()
        await fetchDrivers()
        
        // Clear form
        setDocumentVerificationNotes('')
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        console.error('❌ Failed to verify document:', response.error)
        setError(response.error?.message || 'Failed to verify document')
      }
    } catch (error) {
      console.error('❌ Error verifying document:', error)
      setError('Failed to verify document')
    } finally {
      setActionLoading(null)
    }
  }, [selectedDriver, documentVerificationNotes, handleViewDocuments, fetchDrivers])

  // Handle individual document verification
  const handleApproveDocument = useCallback((documentType: string) => {
    setCurrentDocumentType(documentType)
    // Call the verification function directly
    if (selectedDriver) {
      handleVerifyDocument(documentType, 'verified')
    }
  }, [selectedDriver, handleVerifyDocument])

  // Handle individual document rejection
  const handleRejectDocument = useCallback((documentType: string) => {
    setCurrentDocumentType(documentType)
    setRejectionDialogOpen(true)
  }, [])

  const handleApproveDriver = useCallback(() => {
    if (selectedDriver) {
      setVerificationStatus('approved')
      setVerifyDialogOpen(true)
      handleCloseActions()
    }
  }, [selectedDriver, handleCloseActions])

  const handleRejectDriver = useCallback(() => {
    if (selectedDriver) {
      setVerificationStatus('rejected')
      setVerifyDialogOpen(true)
      handleCloseActions()
    }
  }, [selectedDriver, handleCloseActions])

  // Error boundary for better error handling
  if (error && retryCount >= 3) {
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
        <WarningIcon sx={{ fontSize: 80, color: AdminColors.error, mb: 2 }} />
        <Typography variant="h5" sx={{ color: AdminColors.error, fontWeight: 600, mb: 2 }}>
          Unable to Load Driver Data
        </Typography>
        <Typography variant="body1" color="textSecondary" textAlign="center" sx={{ mb: 3, maxWidth: 400 }}>
          We're experiencing technical difficulties. Please try refreshing the page or contact support if the problem persists.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ bgcolor: AdminColors.primary }}
          >
            Refresh Page
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setError(null)}
          >
            Try Again
          </Button>
        </Stack>
      </Box>
    )
  }

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
          Initializing Driver Management...
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Please wait while we load your data
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* Modern Header */}
      <Fade in={true} timeout={500}>
        <StyledCard sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setSuccess(null)}
              >
                Dismiss
              </Button>
            }
          >
            {success}
          </Alert>
        )}
            
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
                  Driver Management
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
                      icon={<PeopleIcon />}
                      label={`${drivers.length} Drivers`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </Stack>
                </Stack>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                {/* Notification Badge */}
                {notificationCount > 0 && (
                  <Tooltip title={`${notificationCount} pending document verifications`}>
                    <PulseBadge
                      badgeContent={notificationCount}
                      color="error"
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <IconButton 
                        color="warning"
                        aria-label="View pending document verifications"
                        sx={{ 
                          position: 'relative',
                          bgcolor: alpha(AdminColors.warning, 0.1),
                          '&:hover': {
                            bgcolor: alpha(AdminColors.warning, 0.2),
                          }
                        }}
                      >
                        <NotificationsIcon />
                      </IconButton>
                    </PulseBadge>
                  </Tooltip>
                )}

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
                
                {/* Enhanced Refresh Button */}
                <Tooltip title={isRefreshing ? "Refreshing..." : "Refresh data"}>
                  <IconButton 
                    onClick={handleRefresh} 
                    disabled={driversLoading || isRefreshing}
                    aria-label="Refresh driver list"
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

                {/* Sync All Status Button */}
                <Tooltip title="Sync verification status for all drivers">
                  <IconButton 
                    onClick={handleSyncAllDrivers}
                    sx={{
                      bgcolor: AdminColors.success,
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(76, 175, 80, 0.9)',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <CheckCircleIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </CardContent>
        </StyledCard>
      </Fade>

      {/* Enhanced Error Alert with Retry */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={() => setError(null)}
          action={
            <Box display="flex" gap={1}>
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRetry}
                disabled={retryCount >= 3}
              >
                Retry ({3 - retryCount} left)
              </Button>
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </Box>
          }
        >
          <Typography variant="body2" fontWeight="600">
            {error}
          </Typography>
          {retryCount > 0 && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Retry attempt {retryCount} of 3
            </Typography>
          )}
        </Alert>
      )}

      {/* Metrics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} timeout={300}>
            <StyledMetricCard onClick={() => setVerificationFilter('all')}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                      Total Drivers
                    </Typography>
                    <Typography variant="h3" component="div" fontWeight="700" sx={{ color: AdminColors.primary, mb: 1, lineHeight: 1.2 }}>
                      {drivers.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      {onlineDrivers.length} online
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: AdminColors.drivers, width: 64, height: 64, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', border: '3px solid white' }}>
                    <PeopleIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </StyledMetricCard>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} timeout={400}>
            <StyledMetricCard onClick={() => setVerificationFilter('pending')}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                      Pending Verification
                    </Typography>
                    <Typography variant="h3" component="div" fontWeight="700" sx={{ color: AdminColors.warning, mb: 1, lineHeight: 1.2 }}>
                      {pendingVerifications.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      Awaiting approval
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: AdminColors.warning, width: 64, height: 64, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', border: '3px solid white' }}>
                    <PendingIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </StyledMetricCard>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} timeout={500}>
            <StyledMetricCard onClick={() => setStatusFilter('active')}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                      Online Drivers
                    </Typography>
                    <Typography variant="h3" component="div" fontWeight="700" sx={{ color: AdminColors.success, mb: 1, lineHeight: 1.2 }}>
                      {onlineDrivers.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      Available now
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: AdminColors.success, width: 64, height: 64, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', border: '3px solid white' }}>
                    <WifiIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </StyledMetricCard>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} timeout={600}>
            <StyledMetricCard onClick={() => setStatusFilter('blocked')}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                      Blocked Drivers
                    </Typography>
                    <Typography variant="h3" component="div" fontWeight="700" sx={{ color: AdminColors.error, mb: 1, lineHeight: 1.2 }}>
                      {blockedDrivers.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      Suspended/Blocked
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: AdminColors.error, width: 64, height: 64, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', border: '3px solid white' }}>
                    <BlockIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </StyledMetricCard>
          </Zoom>
        </Grid>
      </Grid>

      {/* Modern Search and Filters */}
      <Fade in={true} timeout={700}>
        <StyledCard sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Search Bar */}
              <TextField
                fullWidth
                placeholder="Search drivers by name, phone, email, vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={() => setSearchQuery('')} 
                        size="small"
                        aria-label="Clear search"
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  }
                }}
                aria-label="Search drivers"
                role="searchbox"
              />

              {/* Filters Row */}
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="blocked">Blocked</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Verification</InputLabel>
                  <Select
                    value={verificationFilter}
                    label="Verification"
                    onChange={(e) => setVerificationFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="verified">Verified</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    value={vehicleTypeFilter}
                    label="Vehicle Type"
                    onChange={(e) => setVehicleTypeFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Vehicles</MenuItem>
                    <MenuItem value="honda">Honda</MenuItem>
                    <MenuItem value="toyota">Toyota</MenuItem>
                    <MenuItem value="suzuki">Suzuki</MenuItem>
                    <MenuItem value="bike">Bike</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Rating</InputLabel>
                  <Select
                    value={ratingFilter}
                    label="Rating"
                    onChange={(e) => setRatingFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Ratings</MenuItem>
                    <MenuItem value="4">4+ Stars</MenuItem>
                    <MenuItem value="3">3+ Stars</MenuItem>
                    <MenuItem value="2">2+ Stars</MenuItem>
                    <MenuItem value="1">1+ Stars</MenuItem>
                  </Select>
                </FormControl>

                <Box display="flex" gap={1} ml="auto">
                  <Tooltip title="Grid View">
                    <IconButton 
                      onClick={() => setViewMode('grid')} 
                      color={viewMode === 'grid' ? 'primary' : 'default'}
                      aria-label="Switch to grid view"
                    >
                      <DashboardIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="List View">
                    <IconButton 
                      onClick={() => setViewMode('list')} 
                      color={viewMode === 'list' ? 'primary' : 'default'}
                      aria-label="Switch to list view"
                    >
                      <ListIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Results Summary */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="textSecondary">
                  Showing {paginatedDrivers.length} of {filteredDrivers.length} drivers
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={<SortIcon />}
                    label={`Sort by ${sortBy}`}
                    size="small"
                    variant="outlined"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    icon={<FilterListIcon />}
                    label="Filters"
                    size="small"
                    variant="outlined"
                    onClick={() => setShowFilters(!showFilters)}
                    sx={{ cursor: 'pointer' }}
                  />
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>
      </Fade>

      {/* Notification Panel */}
      {showNotifications && notificationCount > 0 && (
        <Fade in={true} timeout={800}>
          <Card sx={{ mb: 3, border: '2px solid', borderColor: 'warning.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <WarningIcon color="warning" />
                <Typography variant="h6" color="warning.main">
                  Pending Document Verifications ({notificationCount})
                </Typography>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {pendingVerifications.slice(0, 5).map((driver) => (
                  <Chip
                    key={driver.id}
                    label={`${driver.personalInfo?.name || driver.name || 'Unknown'} - ${driver.personalInfo?.phone || 'N/A'}`}
                    color="warning"
                    variant="outlined"
                    onClick={() => {
                      setSelectedDriver(driver);
                      setViewDialogOpen(true);
                      setShowNotifications(false);
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
                {pendingVerifications.length > 5 && (
                  <Chip
                    label={`+${pendingVerifications.length - 5} more`}
                    color="warning"
                    variant="filled"
                  />
                )}
              </Box>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  onClick={() => {
                    setVerificationFilter('pending');
                    setShowNotifications(false);
                  }}
                >
                  View All Pending
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Drivers Display */}
      <Fade in={true} timeout={900}>
        <StyledCard>
          <CardContent sx={{ p: 3 }}>
            {/* Enhanced Grid Header */}
            <Box 
              sx={{ 
                mb: 3,
                p: 3,
                bgcolor: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: 3,
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography 
                    variant="h5" 
                    fontWeight="700" 
                    sx={{ 
                      color: AdminColors.primary,
                      mb: 0.5,
                      background: `linear-gradient(135deg, ${AdminColors.primary} 0%, ${AdminColors.secondary} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {viewMode === 'grid' ? 'Driver Grid' : 'Driver List'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Showing {filteredDrivers.length} of {drivers.length} drivers
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  {driversLoading && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="textSecondary">
                        Loading...
                      </Typography>
                    </Box>
                  )}
                  <Chip
                    icon={<PeopleIcon />}
                    label={`${drivers.length} Total`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
            </Box>

            {driversLoading ? (
              // Loading State
              <Grid container spacing={3}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Skeleton variant="circular" width={56} height={56} sx={{ mr: 2 }} />
                          <Box flex={1}>
                            <Skeleton variant="text" width="80%" height={24} />
                            <Skeleton variant="text" width="60%" height={20} />
                          </Box>
                        </Box>
                        <Box display="flex" gap={1} mb={2}>
                          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                          <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                        </Box>
                        <Skeleton variant="text" width="100%" height={20} />
                        <Skeleton variant="text" width="70%" height={20} />
                        <Skeleton variant="text" width="50%" height={20} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : paginatedDrivers.length === 0 ? (
              // Empty State
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                py={8}
                sx={{ 
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: 3,
                  border: '2px dashed rgba(0, 0, 0, 0.12)'
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: AdminColors.primary, 
                    mb: 3,
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography 
                  variant="h4" 
                  fontWeight="700" 
                  sx={{ 
                    color: AdminColors.primary,
                    mb: 2,
                    background: `linear-gradient(135deg, ${AdminColors.primary} 0%, ${AdminColors.secondary} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {searchQuery ? 'No drivers found' : 'No drivers available'}
                </Typography>
                <Typography 
                  variant="h6" 
                  color="textSecondary" 
                  textAlign="center" 
                  sx={{ mb: 3, maxWidth: 500, fontWeight: 400 }}
                >
                  {searchQuery 
                    ? `No drivers match your search criteria "${searchQuery}". Try adjusting your filters or search terms.`
                    : 'There are currently no drivers in the system. New drivers will appear here once they register.'
                  }
                </Typography>
                <Stack direction="row" spacing={2}>
                  {searchQuery && (
                    <Button 
                      variant="outlined" 
                      onClick={() => setSearchQuery('')}
                      startIcon={<ClearIcon />}
                    >
                      Clear Search
                    </Button>
                  )}
                  <Button 
                    variant="contained" 
                    onClick={handleRefresh}
                    startIcon={<RefreshIcon />}
                    sx={{ bgcolor: AdminColors.primary }}
                  >
                    Refresh
                  </Button>
                </Stack>
              </Box>
            ) : viewMode === 'grid' ? (
              // Enhanced Grid View with Better Spacing
              <Grid container spacing={{ xs: 2, sm: 3, md: 3, lg: 4 }} sx={{ px: { xs: 1, sm: 0 } }}>
                {paginatedDrivers.map((driver, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={driver.id}>
                    <DriverCard driver={driver} index={index} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              // List View
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Driver</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Online</TableCell>
                      <TableCell>Documents</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Trips</TableCell>
                      <TableCell>Earnings</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedDrivers.map((driver) => (
                      <TableRow key={driver.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, width: 40, height: 40, bgcolor: AdminColors.primary }}>
                              {(driver.personalInfo?.name || driver.name || 'D').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {driver.personalInfo?.name || driver.name || 'Unknown'}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {driver.personalInfo?.phone || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={driver.isVerified ? 'Verified' : 'Pending'}
                            color={driver.isVerified ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getOnlineStatus(driver).status}
                            color={getOnlineStatus(driver).color as any}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getDocumentStatus(driver.documents)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {getRatingStars(driver.rating)}
                            <Typography variant="body2" sx={{ ml: 0.5 }}>
                              {driver.rating?.toFixed(1) || '0.0'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {driver.totalTrips || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {formatEarnings(driver.earnings?.total || 0)}
                          </Typography>
                        </TableCell>
                    <TableCell>
                      <Tooltip title="Actions" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenActions(e, driver)}
                          aria-label={`Actions for ${driver.name}`}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(5, 1, 91, 0.08)',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination */}
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          </CardContent>
        </StyledCard>
      </Fade>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Driver Management Actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
        open={speedDialOpen}
      >
        <SpeedDialAction
          icon={<RefreshIcon />}
          tooltipTitle="Sync All Drivers"
          onClick={handleSyncAllDrivers}
        />
        <SpeedDialAction
          icon={<AddIcon />}
          tooltipTitle="Add Driver"
          onClick={() => console.log('Add Driver')}
        />
        <SpeedDialAction
          icon={<DownloadIcon />}
          tooltipTitle="Export Data"
          onClick={() => console.log('Export Data')}
        />
        <SpeedDialAction
          icon={<PrintIcon />}
          tooltipTitle="Print Report"
          onClick={() => window.print()}
        />
        <SpeedDialAction
          icon={<SettingsIcon />}
          tooltipTitle="Settings"
          onClick={() => console.log('Settings')}
        />
      </SpeedDial>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {verificationStatus === 'approved' ? 'Approve Driver' : 'Reject Driver'}
        </DialogTitle>
        <DialogContent>
          {selectedDriver && (
            <Box>
              <Typography variant="body1" mb={2}>
                Driver: {selectedDriver.personalInfo?.name || selectedDriver.name || 'Unknown'}
              </Typography>
              <Typography variant="body1" mb={2}>
                Phone: {selectedDriver.personalInfo?.phone || 'N/A'}
              </Typography>
              <Typography variant="body1" mb={2}>
                Documents: {getDocumentStatus(selectedDriver.documents)}
              </Typography>
              
              {verificationStatus === 'rejected' && (
                <TextField
                  fullWidth
                  label="Rejection Reason"
                  multiline
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  margin="normal"
                  required
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleVerifyDriver}
            variant="contained"
            color={verificationStatus === 'approved' ? 'success' : 'error'}
            disabled={verificationLoading || (verificationStatus === 'rejected' && !rejectionReason.trim())}
          >
            {verificationLoading ? <CircularProgress size={20} /> : (verificationStatus === 'approved' ? 'Approve' : 'Reject')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={rejectionDialogOpen}
        onClose={() => setRejectionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CancelIcon color="error" />
            <Typography variant="h6">Reject Document</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejecting the {currentDocumentType} document:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            variant="outlined"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (rejectionReason.trim()) {
                handleVerifyDocument(currentDocumentType, 'rejected', rejectionReason)
                setRejectionDialogOpen(false)
                setRejectionReason('')
              }
            }}
            variant="contained"
            color="error"
            disabled={!rejectionReason.trim()}
          >
            Reject Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Driver Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Driver Details</DialogTitle>
        <DialogContent>
          {selectedDriver && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <Typography variant="body2" mb={1}>
                  <strong>Name:</strong> {selectedDriver.personalInfo?.name || selectedDriver.name || 'Unknown'}
                </Typography>
                <Typography variant="body2" mb={1}>
                  <strong>Email:</strong> {selectedDriver.personalInfo?.email || 'N/A'}
                </Typography>
                <Typography variant="body2" mb={1}>
                  <strong>Phone:</strong> {selectedDriver.personalInfo?.phone || 'N/A'}
                </Typography>
                <Typography variant="body2" mb={1}>
                  <strong>Joined:</strong> {selectedDriver.createdAt ? new Date(selectedDriver.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
                <Typography variant="body2" mb={1}>
                  <strong>Address:</strong> {selectedDriver.location?.address || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Vehicle Information</Typography>
                {selectedDriver.vehicleDetails ? (
                  <>
                    <Typography variant="body2" mb={1}>
                      <strong>Vehicle Type:</strong> {selectedDriver.vehicleDetails.vehicleType}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Vehicle Number:</strong> {selectedDriver.vehicleDetails.vehicleNumber}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Make:</strong> {selectedDriver.vehicleDetails.vehicleMake}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Model:</strong> {selectedDriver.vehicleDetails.vehicleModel}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Year:</strong> {selectedDriver.vehicleDetails.vehicleYear}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Color:</strong> {selectedDriver.vehicleDetails.vehicleColor}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>License Number:</strong> {selectedDriver.vehicleDetails.licenseNumber}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>License Expiry:</strong> {selectedDriver.vehicleDetails.licenseExpiry}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>RC Number:</strong> {selectedDriver.vehicleDetails.rcNumber}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Insurance Number:</strong> {selectedDriver.vehicleDetails.insuranceNumber}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Insurance Expiry:</strong> {selectedDriver.vehicleDetails.insuranceExpiry}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" mb={1}>
                      <strong>Make:</strong> {selectedDriver.vehicleInfo?.make || selectedDriver.vehicle?.make || 'N/A'}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Model:</strong> {selectedDriver.vehicleInfo?.model || selectedDriver.vehicle?.model || 'N/A'}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Year:</strong> {selectedDriver.vehicleInfo?.year || selectedDriver.vehicle?.year || 'N/A'}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Color:</strong> {selectedDriver.vehicleInfo?.color || selectedDriver.vehicle?.color || 'N/A'}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Plate Number:</strong> {selectedDriver.vehicleInfo?.plateNumber || selectedDriver.vehicle?.plateNumber || 'N/A'}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Document Status</Typography>
                <Grid container spacing={2}>
                  {selectedDriver.documents && Object.entries(selectedDriver.documents).map(([type, doc]: [string, any]) => (
                    <Grid item xs={12} sm={6} md={4} key={type}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            {type.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                          </Typography>
                          {doc?.url ? (
                            doc.url.match(/\.(png|jpe?g|gif|webp)$/i) ? (
                              <img 
                                src={doc.url} 
                                alt={type} 
                                style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: 8, marginBottom: 8 }} 
                              />
                            ) : (
                              <Button 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                variant="outlined" 
                                size="small"
                                startIcon={<DescriptionIcon />}
                                sx={{ mb: 1 }}
                              >
                                View Document
                              </Button>
                            )
                          ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                              Not uploaded
                            </Typography>
                          )}
                          <Chip
                            label={doc?.verified ? 'Verified' : (doc?.status || 'Pending')}
                            color={doc?.verified || doc?.status === 'approved' ? 'success' : 'warning'}
                            size="small"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <ClickAwayListener onClickAway={handleCloseActions}>
        <Menu
          anchorEl={actionsAnchorEl}
          open={Boolean(actionsAnchorEl)}
          onClose={handleCloseActions}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              maxWidth: 250,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 2,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(5, 1, 91, 0.08)',
                },
                '&:first-of-type': {
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                },
                '&:last-of-type': {
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                },
              },
            }
          }}
          MenuListProps={{
            sx: {
              py: 0.5,
            }
          }}
          disableAutoFocusItem
          disableEnforceFocus
          disableRestoreFocus
        >
          <MenuItem onClick={handleViewDetails}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="View Details" 
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
            />
          </MenuItem>
            <MenuItem onClick={handleViewDocuments}>
              <ListItemIcon>
                <DescriptionIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="View Documents" 
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
            </MenuItem>
            <MenuItem onClick={handleDebugDocuments}>
              <ListItemIcon>
                <BugReportIcon fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary="Debug Documents" 
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
            </MenuItem>
            <MenuItem onClick={handleTestVerificationFlow}>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Test Verification Flow" 
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
            </MenuItem>
            <MenuItem onClick={handleTestDocumentAccess}>
              <ListItemIcon>
                <CloudDownloadIcon fontSize="small" color="secondary" />
              </ListItemIcon>
              <ListItemText 
                primary="Test Document Access" 
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleApproveDriver}>
            <ListItemIcon>
              <ThumbUpIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Approve Driver" 
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
            />
          </MenuItem>
          <MenuItem onClick={handleRejectDriver}>
            <ListItemIcon>
              <ThumbDownIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Reject Driver" 
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
            />
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleBanDriver} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <BlockIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Ban Driver" 
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
            />
          </MenuItem>
          <MenuItem onClick={handleDeleteDriver} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Delete Driver" 
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
            />
          </MenuItem>
        </Menu>
      </ClickAwayListener>

      {/* Enhanced Documents Dialog with Comprehensive Folder Structure */}
      <Dialog open={documentsDialogOpen} onClose={() => setDocumentsDialogOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" fontWeight="600">
                Driver Documents - {driverDocuments?.driverName || selectedDriver?.personalInfo?.name || 'Unknown Driver'}
              </Typography>
              {driverDocuments && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Found {driverDocuments.totalDocuments} documents across {driverDocuments.totalFolders} folders
                </Typography>
              )}
            </Box>
            <Box display="flex" gap={1}>
              <Chip
                label={documentsLoading ? 'Loading...' : `${Object.keys(driverDocuments?.documents || {}).length} Documents`}
                color="primary"
                variant="outlined"
              />
              {driverDocuments?.folderStructure && (
                <Chip
                  label={`${Object.keys(driverDocuments.folderStructure).length} Folders`}
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {documentsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ ml: 2 }}>
                Discovering documents...
              </Typography>
            </Box>
          ) : driverDocuments && driverDocuments.documents ? (
            <Box>
              {/* Folder Structure Overview */}
              {driverDocuments.folderStructure && Object.keys(driverDocuments.folderStructure).length > 0 && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Folder Structure
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(driverDocuments.folderStructure).map(([folder, count]: [string, any]) => (
                      <Grid item xs={6} sm={4} md={3} key={folder}>
                        <Chip
                          label={`${folder} (${count})`}
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Verification Notes */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Verification Notes
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add notes for document verification..."
                  value={documentVerificationNotes}
                  onChange={(e) => setDocumentVerificationNotes(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {/* Vehicle Details Section - CRITICAL ENHANCEMENT */}
              {selectedDriver?.vehicleDetails && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 2, border: '1px solid rgba(25, 118, 210, 0.2)' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                    🚗 Vehicle Details for Verification
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <strong>Vehicle Type:</strong> {selectedDriver.vehicleDetails.vehicleType}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <strong>Vehicle Number:</strong> {selectedDriver.vehicleDetails.vehicleNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <strong>Make & Model:</strong> {selectedDriver.vehicleDetails.vehicleMake} {selectedDriver.vehicleDetails.vehicleModel}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <strong>Year:</strong> {selectedDriver.vehicleDetails.vehicleYear}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <strong>Color:</strong> {selectedDriver.vehicleDetails.vehicleColor}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <strong>License Number:</strong> {selectedDriver.vehicleDetails.licenseNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <strong>License Expiry:</strong> {selectedDriver.vehicleDetails.licenseExpiry}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <strong>RC Number:</strong> {selectedDriver.vehicleDetails.rcNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <strong>Insurance Number:</strong> {selectedDriver.vehicleDetails.insuranceNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <strong>Insurance Expiry:</strong> {selectedDriver.vehicleDetails.insuranceExpiry}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    💡 Compare these details with the uploaded documents (RC Book, License, Insurance) for verification
                  </Typography>
                </Box>
              )}

              {/* Documents Grid */}
              <Grid container spacing={3}>
                {Object.entries(driverDocuments.documents).map(([key, doc]: [string, any]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Card 
                      variant="outlined"
                      sx={{
                        height: '100%',
                        border: doc?.verified ? '2px solid #4caf50' : doc?.status === 'rejected' ? '2px solid #f44336' : '1px solid rgba(0, 0, 0, 0.12)',
                        borderRadius: 2
                      }}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" fontWeight="600">
                            {doc?.documentType?.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()) || 'Document'}
                          </Typography>
                          <Chip
                            label={doc?.verified ? 'Verified' : (doc?.status || 'Pending')}
                            color={doc?.verified ? 'success' : doc?.status === 'rejected' ? 'error' : 'warning'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>

                        {/* Folder Info */}
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={`📁 ${doc?.folder || 'Unknown'}`}
                            size="small"
                            variant="outlined"
                            color="info"
                            sx={{ mr: 1 }}
                          />
                          {doc?.isLegacy && (
                            <Chip
                              label="Legacy"
                              size="small"
                              variant="outlined"
                              color="warning"
                            />
                          )}
                        </Box>

                        {doc?.url ? (
                          <Box>
                            {/* Document Preview */}
                            {doc.url.match(/\.(png|jpe?g|gif|webp)$/i) ? (
                              <Box sx={{ mb: 2 }}>
                                <img 
                                  src={doc.url} 
                                  alt={doc.documentType} 
                                  style={{ 
                                    width: '100%', 
                                    maxHeight: '200px', 
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    border: '1px solid rgba(0, 0, 0, 0.1)'
                                  }} 
                                />
                              </Box>
                            ) : (
                              <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                  {doc.fileName || 'Document'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Size: {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  Type: {doc.contentType || 'Unknown'}
                                </Typography>
                              </Box>
                            )}

                            {/* Document Actions */}
                            <Box display="flex" gap={1} mb={2}>
                              <Button 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                variant="outlined" 
                                size="small"
                                startIcon={<VisibilityIcon />}
                                fullWidth
                              >
                                View
                              </Button>
                              <Button 
                                href={doc.url} 
                                download
                                variant="outlined" 
                                size="small"
                                startIcon={<CloudDownloadIcon />}
                                fullWidth
                              >
                                Download
                              </Button>
                            </Box>

                            {/* Verification Actions */}
                            {!doc?.verified && (
                              <Box display="flex" gap={1}>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => handleApproveDocument(doc.documentType)}
                                  disabled={actionLoading === `verify-${doc.documentType}`}
                                  startIcon={<CheckCircleIcon />}
                                  fullWidth
                                  aria-label={`Verify ${doc.documentType} document`}
                                >
                                  {actionLoading === `verify-${doc.documentType}` ? <CircularProgress size={16} /> : 'Verify'}
                                </Button>
                                <Button
                                  variant="contained"
                                  color="error"
                                  size="small"
                                  onClick={() => handleRejectDocument(doc.documentType)}
                                  disabled={actionLoading === `verify-${doc.documentType}`}
                                  startIcon={<CancelIcon />}
                                  fullWidth
                                  aria-label={`Reject ${doc.documentType} document`}
                                >
                                  {actionLoading === `verify-${doc.documentType}` ? <CircularProgress size={16} /> : 'Reject'}
                                </Button>
                              </Box>
                            )}

                            {/* Verification Notes */}
                            {doc?.verificationNotes && (
                              <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
                                <Typography variant="caption" color="textSecondary">
                                  <strong>Notes:</strong> {doc.verificationNotes}
                                </Typography>
                              </Box>
                            )}

                            {/* Rejection Reason */}
                            {doc?.rejectionReason && (
                              <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(244, 67, 54, 0.1)', borderRadius: 1, border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                                <Typography variant="caption" color="error">
                                  <strong>Rejection Reason:</strong> {doc.rejectionReason}
                                </Typography>
                              </Box>
                            )}

                            {/* Upload Date */}
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                              Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown'}
                            </Typography>
                          </Box>
                        ) : (
                          <Box textAlign="center" py={4}>
                            <DescriptionIcon sx={{ fontSize: 48, color: 'textSecondary', mb: 1 }} />
                            <Typography variant="body2" color="textSecondary">
                              No document uploaded
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Summary */}
              {driverDocuments && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Document Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Total Documents
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {driverDocuments.totalDocuments}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Verified
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {Object.values(driverDocuments.documents).filter((doc: any) => doc.verified).length}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Pending
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {Object.values(driverDocuments.documents).filter((doc: any) => !doc.verified && doc.status !== 'rejected').length}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Rejected
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {Object.values(driverDocuments.documents).filter((doc: any) => doc.status === 'rejected').length}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          ) : (
            <Box textAlign="center" py={8}>
              <DescriptionIcon sx={{ fontSize: 80, color: 'textSecondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No documents found for this driver
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Documents will appear here once the driver uploads them
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentsDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => handleViewDocuments()}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Driver</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this driver? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Driver: {selectedDriver?.name || selectedDriver?.personalInfo?.name}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)}>
        <DialogTitle>Ban Driver</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to ban this driver? They will not be able to log in again.
          </Typography>
          <TextField
            fullWidth
            label="Reason (optional)"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Enter reason for banning..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmBan} color="error" variant="contained">
            Ban Driver
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
})

ModernDriverManagement.displayName = 'ModernDriverManagement'

export default ModernDriverManagement
