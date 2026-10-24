import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
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
  Tooltip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
  Backdrop,
  Skeleton,
  Zoom,
  useMediaQuery,
  TextField,
} from '@mui/material'
import {
  LocalHospital as EmergencyIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  // Cancel as CancelIcon, // Removed unused import
  PriorityHigh as PriorityHighIcon,
  MedicalServices as MedicalIcon,
  // Report as ReportIcon, // Removed unused import
  Security as SecurityIcon,
  Help as HelpIcon,
  // Notifications as NotificationsIcon, // Removed unused import
  // MyLocation as MyLocationIcon, // Removed unused import
  // Directions as DirectionsIcon, // Removed unused import
  // Call as CallIcon, // Removed unused import
  // Message as MessageIcon, // Removed unused import
  Close as CloseIcon,
  // Error as ErrorIcon, // Removed unused import
  // Info as InfoIcon, // Removed unused import
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
} from '@mui/icons-material'
import { comprehensiveAdminService } from '../services/comprehensiveAdminService'
import { AdminColors } from '../constants/Colors'
import AdminFetchState from '../components/AdminFetchState'

interface EmergencyAlert {
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
  status: 'active' | 'responded' | 'resolved' | 'false_alarm' | 'acknowledged'
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

const ModernEmergencyServices: React.FC = () => {
  // Responsive hooks
  const isMobileDialog = useMediaQuery('(max-width: 600px)')
  
  // State management
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [retryCount, setRetryCount] = useState(0)
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info')
  const [statusFilter, setStatusFilter] = useState<'ops' | 'all' | 'resolved'>('ops')
  const [emergencyNote, setEmergencyNote] = useState('')
  const [updatingAlert, setUpdatingAlert] = useState(false)
  
  // Refs for cleanup
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Stats with memoization
  const stats = useMemo(() => ({
    total: alerts.length,
    active: activeAlerts.length,
    resolved: alerts.filter(alert => alert.status === 'resolved').length,
    critical: alerts.filter(alert => alert.priority === 'critical').length
  }), [alerts, activeAlerts])

  // Data validation and sanitization
  const validateAlert = useCallback((alert: any): EmergencyAlert | null => {
    try {
      if (!alert || typeof alert !== 'object') return null

      return {
        id: alert.id || 'unknown',
        alertId: alert.alertId || alert.id || 'unknown',
        userId: alert.userId || 'unknown',
        userType: ['customer', 'driver'].includes(alert.userType) ? alert.userType : 'customer',
        userInfo: {
          name: alert.userInfo?.name || alert.customerName || 'Unknown User',
          phone: alert.userInfo?.phone || alert.phone || 'N/A'
        },
        type: ['sos', 'accident', 'harassment', 'medical', 'other'].includes(alert.type) ? alert.type : 'other',
        priority: ['low', 'medium', 'high', 'critical'].includes(alert.priority) ? alert.priority : 'low',
        location: {
          address: alert.location?.address || 'Location not available',
          latitude: typeof alert.location?.latitude === 'number' ? alert.location.latitude : 0,
          longitude: typeof alert.location?.longitude === 'number' ? alert.location.longitude : 0
        },
        description: alert.description || 'No description available',
        status: ['active', 'responded', 'resolved', 'false_alarm'].includes(alert.status) ? alert.status : 'active',
        bookingId: alert.bookingId,
        response: alert.response,
        createdAt: alert.createdAt || new Date().toISOString(),
        updatedAt: alert.updatedAt || new Date().toISOString(),
        resolvedAt: alert.resolvedAt
      }
    } catch (error) {
      console.error('Error validating alert:', error)
      return null
    }
  }, [])

  // Show snackbar notification
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }, [])

  // Initialize service and fetch data with retry logic
  useEffect(() => {
    const initializeService = async () => {
      try {
        setLoading(true)
        setError(null)
        
        await comprehensiveAdminService.initialize()
        await fetchEmergencyAlerts()
        setIsInitialized(true)
        setRetryCount(0)
        
        showSnackbar('Emergency Services initialized successfully', 'success')
      } catch (error) {
        console.error('Failed to initialize emergency service:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize emergency service'
        setError(errorMessage)
        showSnackbar(errorMessage, 'error')
        
        // Retry logic with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000
          timeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, delay)
        }
      } finally {
        setLoading(false)
      }
    }

    if (!isInitialized && retryCount < 3) {
      initializeService()
    }
  }, [isInitialized, retryCount, showSnackbar])

  // Fetch emergency alerts with improved error handling
  const fetchEmergencyAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await comprehensiveAdminService.getEmergencyAlerts()
      
      if (response.success && response.data) {
        const alertsData = Array.isArray(response.data) ? response.data : []
        const validatedAlerts = alertsData
          .map(validateAlert)
          .filter((alert): alert is EmergencyAlert => alert !== null)
        
        setAlerts(validatedAlerts)
        setActiveAlerts(
          validatedAlerts.filter((alert) =>
            statusFilter === 'all'
              ? true
              : statusFilter === 'resolved'
                ? alert.status === 'resolved'
                : alert.status === 'active' || alert.status === 'acknowledged',
          ),
        )
        setLastRefresh(new Date())
        setRetryCount(0)
        
        console.log(`✅ Fetched ${validatedAlerts.length} emergency alerts`)
      } else {
        const errorMessage = response.error?.message || 'Failed to fetch emergency alerts'
        setError(errorMessage)
        showSnackbar(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error fetching emergency alerts:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch emergency alerts'
      setError(errorMessage)
      showSnackbar(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }, [validateAlert, showSnackbar, statusFilter])

  // Handle refresh with loading state
  const handleRefresh = useCallback(async () => {
    if (loading) return
    
    try {
      await fetchEmergencyAlerts()
      showSnackbar('Emergency alerts refreshed', 'success')
    } catch (error) {
      console.error('Error refreshing alerts:', error)
      showSnackbar('Failed to refresh alerts', 'error')
    }
  }, [fetchEmergencyAlerts, loading, showSnackbar])

  // Get alert type icon with fallback
  const getAlertTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'medical': return <MedicalIcon />
      case 'accident': return <WarningIcon />
      case 'harassment': return <SecurityIcon />
      case 'sos': return <EmergencyIcon />
      default: return <HelpIcon />
    }
  }, [])

  // Get priority color with fallback
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'critical': return '#d32f2f'
      case 'high': return '#f57c00'
      case 'medium': return '#1976d2'
      case 'low': return '#388e3c'
      default: return '#757575'
    }
  }, [])

  // Get status color with fallback
  // const getStatusColor = useCallback((status: string) => { // Removed unused function
  //   switch (status) {
  //     case 'active': return '#d32f2f'
  //     case 'responded': return '#f57c00'
  //     case 'resolved': return '#388e3c'
  //     case 'false_alarm': return '#757575'
  //     default: return '#757575'
  //   }
  // }, [])

  // Format time with error handling
  const formatTime = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleString()
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  }, [])

  useEffect(() => {
    if (isInitialized) {
      fetchEmergencyAlerts()
    }
  }, [statusFilter, isInitialized, fetchEmergencyAlerts])

  // Auto-refresh with cleanup
  useEffect(() => {
    if (!isInitialized || !isAutoRefreshEnabled) return

    intervalRef.current = setInterval(() => {
      fetchEmergencyAlerts()
    }, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isInitialized, isAutoRefreshEnabled, fetchEmergencyAlerts])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Handle dialog close with cleanup
  const handleCloseViewDialog = useCallback(() => {
    setViewDialogOpen(false)
    setSelectedAlert(null)
  }, [])

  // Loading state with skeleton
  if (loading && !isInitialized) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={300} height={60} />
          <Skeleton variant="text" width={200} height={30} />
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={250} height={40} />
          <Box sx={{ mt: 2 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 2 }} />
            ))}
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight="700" color={AdminColors.primary} gutterBottom>
              Emergency Services
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Alerts: {stats.total} | Active: {stats.active}
            </Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <Tooltip title={isAutoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}>
              <IconButton
                onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
                sx={{ 
                  color: isAutoRefreshEnabled ? AdminColors.primary : 'textSecondary',
                  border: `1px solid ${isAutoRefreshEnabled ? AdminColors.primary : 'rgba(0, 0, 0, 0.23)'}`,
                  borderRadius: 1
                }}
              >
                {isAutoRefreshEnabled ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Tooltip>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{ borderColor: AdminColors.primary, color: AdminColors.primary }}
            >
              {loading ? <CircularProgress size={20} /> : 'Refresh'}
            </Button>
            
            <Chip
              icon={<AccessTimeIcon />}
              label={`Last updated: ${lastRefresh.toLocaleTimeString()}`}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Error Alert */}
        {error && alerts.length > 0 && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
            }
          }}>
            <Avatar sx={{ 
              bgcolor: AdminColors.primary, 
              mx: 'auto', 
              mb: 1,
              width: 48,
              height: 48
            }}>
              <EmergencyIcon />
            </Avatar>
            <Typography variant="h4" fontWeight="700" color={AdminColors.primary}>
              {stats.total}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Alerts
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
            }
          }}>
            <Avatar sx={{ 
              bgcolor: '#d32f2f', 
              mx: 'auto', 
              mb: 1,
              width: 48,
              height: 48
            }}>
              <WarningIcon />
            </Avatar>
            <Typography variant="h4" fontWeight="700" color="#d32f2f">
              {stats.active}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Active Alerts
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
            }
          }}>
            <Avatar sx={{ 
              bgcolor: '#388e3c', 
              mx: 'auto', 
              mb: 1,
              width: 48,
              height: 48
            }}>
              <CheckCircleIcon />
            </Avatar>
            <Typography variant="h4" fontWeight="700" color="#388e3c">
              {stats.resolved}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Resolved
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
            }
          }}>
            <Avatar sx={{ 
              bgcolor: '#d32f2f', 
              mx: 'auto', 
              mb: 1,
              width: 48,
              height: 48
            }}>
              <PriorityHighIcon />
            </Avatar>
            <Typography variant="h4" fontWeight="700" color="#d32f2f">
              {stats.critical}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Critical
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Active Emergency Alerts */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="h5" fontWeight="600">
            Emergency alerts ({activeAlerts.length})
          </Typography>
          <Box display="flex" gap={1}>
            <Chip label="Active + acknowledged" color={statusFilter === 'ops' ? 'primary' : 'default'} onClick={() => setStatusFilter('ops')} />
            <Chip label="Resolved" color={statusFilter === 'resolved' ? 'primary' : 'default'} onClick={() => setStatusFilter('resolved')} />
            <Chip label="All" color={statusFilter === 'all' ? 'primary' : 'default'} onClick={() => setStatusFilter('all')} />
          </Box>
          {isAutoRefreshEnabled && (
            <Chip
              icon={<PlayArrowIcon />}
              label="Auto-refresh enabled"
              color="success"
              variant="outlined"
              size="small"
            />
          )}
        </Box>
        
        <AdminFetchState
          loading={loading && alerts.length === 0 && !error}
          error={error}
          onRetry={handleRefresh}
          empty={!loading && !error && activeAlerts.length === 0}
          emptyMessage="No emergency alerts match your filters."
        >
          <Grid container spacing={3}>
            {activeAlerts.map((alert, index) => (
              <Grid item xs={12} sm={6} md={4} key={alert.id}>
                <Zoom in={true} timeout={300 + index * 100}>
                  <Card sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: 3,
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                      borderColor: getPriorityColor(alert.priority),
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: `linear-gradient(90deg, ${getPriorityColor(alert.priority)} 0%, ${getPriorityColor(alert.priority)}80 100%)`,
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ 
                            bgcolor: getPriorityColor(alert.priority),
                            width: 40,
                            height: 40
                          }}>
                            {getAlertTypeIcon(alert.type)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="600" color={AdminColors.primary}>
                              {alert.userInfo.name || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {alert.type.toUpperCase()}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={alert.priority}
                          size="small"
                          sx={{
                            bgcolor: getPriorityColor(alert.priority),
                            color: 'white',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                        />
                      </Box>

                      {/* Location */}
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <LocationOnIcon sx={{ color: 'textSecondary', fontSize: 20 }} />
                        <Typography variant="body2" color="textSecondary" sx={{ flex: 1 }}>
                          {alert.location.address}
                        </Typography>
                      </Box>

                      {/* Time */}
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <AccessTimeIcon sx={{ color: 'textSecondary', fontSize: 20 }} />
                        <Typography variant="body2" color="textSecondary">
                          {formatTime(alert.createdAt)}
                        </Typography>
                      </Box>

                      {/* Description */}
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        {alert.description || 'No description available'}
                      </Typography>

                      {/* Actions */}
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            setSelectedAlert(alert)
                            setViewDialogOpen(true)
                          }}
                          sx={{ flex: 1 }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </AdminFetchState>
      </Box>

      {/* View Alert Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth fullScreen={isMobileDialog}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Emergency Alert Details</Typography>
            <IconButton onClick={handleCloseViewDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Alert Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <EmergencyIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Alert Type" 
                        secondary={selectedAlert.type.toUpperCase()} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PriorityHighIcon sx={{ color: getPriorityColor(selectedAlert.priority) }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Priority" 
                        secondary={selectedAlert.priority.toUpperCase()} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AccessTimeIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Created At" 
                        secondary={formatTime(selectedAlert.createdAt)} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>User Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: AdminColors.primary }}>
                          {selectedAlert.userInfo.name?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary="Name" 
                        secondary={selectedAlert.userInfo.name || 'Unknown'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Phone" 
                        secondary={selectedAlert.userInfo.phone || 'N/A'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationOnIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Location" 
                        secondary={selectedAlert.location.address} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Description</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedAlert.description || 'No description available'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
          <TextField
            size="small"
            label="Note (optional)"
            value={emergencyNote}
            onChange={(e) => setEmergencyNote(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />
          {selectedAlert && selectedAlert.status === 'active' && (
            <Button
              variant="outlined"
              disabled={updatingAlert}
              onClick={async () => {
                setUpdatingAlert(true)
                try {
                  await comprehensiveAdminService.updateEmergencyStatus(selectedAlert.id, 'acknowledged', emergencyNote || undefined)
                  await fetchEmergencyAlerts()
                  setViewDialogOpen(false)
                  setEmergencyNote('')
                  showSnackbar('Alert acknowledged', 'success')
                } catch {
                  showSnackbar('Failed to update alert', 'error')
                } finally {
                  setUpdatingAlert(false)
                }
              }}
            >
              Acknowledge
            </Button>
          )}
          {selectedAlert && (selectedAlert.status === 'active' || selectedAlert.status === 'acknowledged') && (
            <Button
              variant="contained"
              color="success"
              disabled={updatingAlert}
              onClick={async () => {
                setUpdatingAlert(true)
                try {
                  await comprehensiveAdminService.updateEmergencyStatus(selectedAlert.id, 'resolved', emergencyNote || undefined)
                  await fetchEmergencyAlerts()
                  setViewDialogOpen(false)
                  setEmergencyNote('')
                  showSnackbar('Alert resolved', 'success')
                } catch {
                  showSnackbar('Failed to resolve alert', 'error')
                } finally {
                  setUpdatingAlert(false)
                }
              }}
            >
              Resolve
            </Button>
          )}
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Loading backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && !isInitialized}
      >
        <Box textAlign="center">
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Emergency Services...
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  )
}

export default ModernEmergencyServices