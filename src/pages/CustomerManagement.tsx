import React, { useState, useCallback, useEffect } from 'react'
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
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  useMediaQuery,
} from '@mui/material'
import {
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Pending as PendingIcon,
  Info as InfoIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material'
import { customerService } from '../services/customerService'
import { useNavigate } from 'react-router-dom'
import { websocketService } from '../services/websocketService'
import { secureTokenStorage } from '../services/secureTokenStorage'

interface Customer {
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
  // No wallet system for customers
}

const CustomerManagement: React.FC = () => {
  const navigate = useNavigate()
  
  // Responsive hooks
  const isMobileDialog = useMediaQuery('(max-width: 600px)')

  // State management
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  // const [selectedTab, setSelectedTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [rowsPerPage] = useState(10)
  // const [totalCount, setTotalCount] = useState(0)

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  // Wallet-related state removed - no wallet system for customers
  const [actionReason, setActionReason] = useState('')

  // Action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [actionMenuCustomer, setActionMenuCustomer] = useState<Customer | null>(null)

  // Load customers
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await customerService.getCustomers()
      
      if (response.success && response.data) {
        setCustomers(response.data)
        // setTotalCount(response.data.length)
      } else {
        setError(response.error?.message || 'Failed to load customers')
      }
    } catch (err) {
      setError('Failed to load customers')
      console.error('Error loading customers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle customer actions
  const handleDeleteCustomer = async () => {
    if (!actionMenuCustomer) return

    try {
      const response = await customerService.deleteCustomer(actionMenuCustomer.id)
      
      if (response.success) {
        await loadCustomers()
        setDeleteDialogOpen(false)
        setActionMenuAnchor(null)
        setActionMenuCustomer(null)
      } else {
        setError(response.error?.message || 'Failed to delete customer')
      }
    } catch (err) {
      setError('Failed to delete customer')
      console.error('Error deleting customer:', err)
    }
  }

  const handleBanCustomer = async () => {
    if (!actionMenuCustomer) return

    try {
      const response = await customerService.banCustomer(actionMenuCustomer.id, actionReason)
      
      if (response.success) {
        await loadCustomers()
        setBanDialogOpen(false)
        setActionMenuAnchor(null)
        setActionMenuCustomer(null)
        setActionReason('')
      } else {
        setError(response.error?.message || 'Failed to ban customer')
      }
    } catch (err) {
      setError('Failed to ban customer')
      console.error('Error banning customer:', err)
    }
  }

  const handleSuspendCustomer = async () => {
    if (!actionMenuCustomer) return

    try {
      const status = actionMenuCustomer.accountStatus === 'suspended' ? 'active' : 'suspended'
      const response = await customerService.updateCustomerStatus(actionMenuCustomer.id, status, actionReason)
      
      if (response.success) {
        await loadCustomers()
        setSuspendDialogOpen(false)
        setActionMenuAnchor(null)
        setActionMenuCustomer(null)
        setActionReason('')
      } else {
        setError(response.error?.message || 'Failed to update customer status')
      }
    } catch (err) {
      setError('Failed to update customer status')
      console.error('Error updating customer status:', err)
    }
  }

  // Wallet adjustment method removed - no wallet system for customers

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = !searchTerm || 
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      
      const matchesStatus = statusFilter === 'all' || customer.accountStatus === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof Customer]
      let bValue = b[sortBy as keyof Customer]
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = a.createdAt
        bValue = b.createdAt
      }
      
      if (sortOrder === 'asc') {
        return (aValue || 0) > (bValue || 0) ? 1 : -1
      } else {
        return (aValue || 0) < (bValue || 0) ? 1 : -1
      }
    })

  // Pagination
  const startIndex = (page - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex)

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'suspended': return 'warning'
      case 'banned': return 'error'
      default: return 'default'
    }
  }

  // Get status icon
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />
      case 'suspended': return <PendingIcon />
      case 'banned': return <BlockIcon />
      default: return <InfoIcon />
    }
  }

  // ✅ CRITICAL FIX: Initialize WebSocket and set up real-time booking count updates
  useEffect(() => {
    let isMounted = true
    const eventHandlers: { [key: string]: (data: any) => void } = {}
    
    // ✅ CRITICAL FIX: Listen for booking events to update customer counts in real-time
    const handleBookingCreated = (data: any) => {
      console.log('📦 [CustomerManagement] Booking created, refreshing customer list:', data)
      if (isMounted) {
        // Refresh customer list to update booking counts
        loadCustomers()
      }
    }
    
    const handleBookingDeleted = (data: any) => {
      console.log('🗑️ [CustomerManagement] Booking deleted, refreshing customer list:', data)
      if (isMounted) {
        // Refresh customer list to update booking counts
        loadCustomers()
      }
    }
    
    const handleBookingStatusUpdate = (data: any) => {
      // Only refresh if status changes to/from completed, cancelled, or delivered
      // These status changes might affect booking counts if filtering is implemented
      const relevantStatuses = ['completed', 'cancelled', 'delivered']
      if (data.status && relevantStatuses.includes(data.status)) {
        console.log('📊 [CustomerManagement] Booking status update, refreshing customer list:', data)
        if (isMounted) {
          loadCustomers()
        }
      }
    }
    
    // Store handlers for cleanup
    eventHandlers['booking_created'] = handleBookingCreated
    eventHandlers['booking_deleted'] = handleBookingDeleted
    eventHandlers['booking_status_update'] = handleBookingStatusUpdate
    
    const initializeWebSocket = async () => {
      try {
        // Get authentication token
        const token = await secureTokenStorage.getToken()
        if (token && token.length > 10) {
          try {
            await websocketService.connect(token)
            console.log('✅ [CustomerManagement] WebSocket connected for real-time booking updates')
            
            // Register WebSocket event listeners after connection
            websocketService.on('booking_created', handleBookingCreated)
            websocketService.on('booking_deleted', handleBookingDeleted)
            websocketService.on('booking_status_update', handleBookingStatusUpdate)
            console.log('✅ [CustomerManagement] Real-time booking event listeners registered')
          } catch (wsError) {
            console.warn('⚠️ [CustomerManagement] WebSocket connection failed, continuing without real-time updates:', wsError)
          }
        }
      } catch (error) {
        console.error('❌ [CustomerManagement] Error initializing WebSocket:', error)
        // Don't fail if WebSocket initialization fails - continue without real-time updates
      }
    }
    
    // Initialize WebSocket (don't await - let it run in background)
    initializeWebSocket()
    
    // Initial load of customers
    loadCustomers()
    
    // Cleanup on unmount
    return () => {
      isMounted = false
      // Clean up event listeners
      if (eventHandlers) {
        if (eventHandlers['booking_created']) {
          websocketService.off('booking_created', eventHandlers['booking_created'])
        }
        if (eventHandlers['booking_deleted']) {
          websocketService.off('booking_deleted', eventHandlers['booking_deleted'])
        }
        if (eventHandlers['booking_status_update']) {
          websocketService.off('booking_status_update', eventHandlers['booking_status_update'])
        }
        console.log('🧹 [CustomerManagement] Real-time booking event listeners cleaned up')
      }
    }
  }, [loadCustomers])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Customer Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage customer accounts, status, and wallet balances
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="banned">Banned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="createdAt">Registration Date</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="accountStatus">Status</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadCustomers}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Registration</TableCell>
                  <TableCell>Bookings</TableCell>
                  {/* Wallet column removed - no wallet system for customers */}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {customer.name || customer.personalInfo?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {customer.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          <EmailIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          {customer.email || customer.personalInfo?.email || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          <PhoneIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          {customer.phone || customer.personalInfo?.phone || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(customer.accountStatus)}
                        label={customer.accountStatus || 'Unknown'}
                        color={getStatusColor(customer.accountStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {customer.bookingsCount || 0} bookings
                      </Typography>
                    </TableCell>
                    {/* Wallet cell removed - no wallet system for customers */}
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => {
                          setActionMenuAnchor(e.currentTarget)
                          setActionMenuCustomer(customer)
                        }}
                      >
                        <MoreHorizIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredCustomers.length > rowsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(filteredCustomers.length / rowsPerPage)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => {
          setActionMenuAnchor(null)
          setActionMenuCustomer(null)
        }}
      >
        <MenuItem
          onClick={() => {
            setActionMenuAnchor(null)
            // setSelectedCustomer(actionMenuCustomer)
            navigate(`/customers/${actionMenuCustomer?.id}`)
          }}
        >
          <ListItemIcon>
            <VisibilityIcon />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSuspendDialogOpen(true)
            setActionMenuAnchor(null)
          }}
        >
          <ListItemIcon>
            {actionMenuCustomer?.accountStatus === 'suspended' ? <UnlockIcon /> : <LockIcon />}
          </ListItemIcon>
          <ListItemText>
            {actionMenuCustomer?.accountStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
          </ListItemText>
        </MenuItem>
        {/* Wallet menu item removed - no wallet system for customers */}
        <MenuItem
          onClick={() => {
            setBanDialogOpen(true)
            setActionMenuAnchor(null)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <BlockIcon />
          </ListItemIcon>
          <ListItemText>Ban Customer</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true)
            setActionMenuAnchor(null)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText>Delete Customer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullScreen={isMobileDialog}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this customer? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Customer: {actionMenuCustomer?.name || actionMenuCustomer?.personalInfo?.name}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteCustomer} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)} fullScreen={isMobileDialog}>
        <DialogTitle>Ban Customer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to ban this customer? They will not be able to log in again.
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
          <Button onClick={handleBanCustomer} color="error" variant="contained">
            Ban Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suspend/Unsuspend Dialog */}
      <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)} fullScreen={isMobileDialog}>
        <DialogTitle>
          {actionMenuCustomer?.accountStatus === 'suspended' ? 'Unsuspend' : 'Suspend'} Customer
        </DialogTitle>
        <DialogContent>
          <Typography>
            {actionMenuCustomer?.accountStatus === 'suspended' 
              ? 'Are you sure you want to unsuspend this customer?'
              : 'Are you sure you want to suspend this customer?'
            }
          </Typography>
          <TextField
            fullWidth
            label="Reason (optional)"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Enter reason..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSuspendCustomer} 
            color={actionMenuCustomer?.accountStatus === 'suspended' ? 'success' : 'warning'} 
            variant="contained"
          >
            {actionMenuCustomer?.accountStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wallet dialog removed - no wallet system for customers */}
    </Box>
  )
}

export default CustomerManagement
