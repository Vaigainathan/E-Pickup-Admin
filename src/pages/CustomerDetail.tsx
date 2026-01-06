import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
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
  Alert,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
} from '@mui/material'
import {
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Pending as PendingIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon,
  DirectionsCar as CarIcon,
  TwoWheeler as BikeIcon,
  LocalTaxi as TaxiIcon,
  DirectionsBus as BusIcon,
  Train as TrainIcon,
  Flight as FlightIcon,
  DirectionsWalk as WalkIcon,
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material'
import { customerService } from '../services/customerService'
import { useParams, useNavigate } from 'react-router-dom'
import { Booking } from '../types'

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

const CustomerDetail: React.FC = () => {
  // Responsive hooks
  const isMobileDialog = useMediaQuery('(max-width: 600px)')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()


  // State management
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [updatingName, setUpdatingName] = useState(false)
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all')
  const [bookingDateFrom, setBookingDateFrom] = useState<string>('')
  const [bookingDateTo, setBookingDateTo] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState(0)

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  // Wallet-related state removed - no wallet system for customers
  const [actionReason, setActionReason] = useState('')

  // Load customer data
  const loadCustomer = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await customerService.getCustomer(id)
      
      if (response.success && response.data) {
        setCustomer(response.data)
      } else {
        setError(response.error?.message || 'Failed to load customer')
      }
    } catch (err) {
      setError('Failed to load customer')
      console.error('Error loading customer:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load customer bookings
  const loadBookings = async (status?: string) => {
    if (!id) return

    try {
      const response = await customerService.getCustomerBookings(id, status)
      
      if (response.success && response.data) {
        setBookings(response.data)
        applyBookingFilters(response.data)
      }
    } catch (err) {
      console.error('Error loading bookings:', err)
    }
  }

  const applyBookingFilters = (bookingsList: Booking[]) => {
    let filtered = [...bookingsList]

    // Filter by status
    if (bookingStatusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === bookingStatusFilter)
    }

    // Filter by date range
    if (bookingDateFrom) {
      const fromDate = new Date(bookingDateFrom)
      filtered = filtered.filter(b => new Date(b.createdAt) >= fromDate)
    }
    if (bookingDateTo) {
      const toDate = new Date(bookingDateTo)
      toDate.setHours(23, 59, 59, 999) // Include entire end date
      filtered = filtered.filter(b => new Date(b.createdAt) <= toDate)
    }

    setFilteredBookings(filtered)
  }

  useEffect(() => {
    if (bookings.length > 0) {
      applyBookingFilters(bookings)
    }
  }, [bookingStatusFilter, bookingDateFrom, bookingDateTo, bookings])

  // Calculate summary metrics
  const bookingSummary = useMemo(() => {
    const total = bookings.length
    const completed = bookings.filter(b => b.status === 'completed' || b.status === 'delivered').length
    const cancelled = bookings.filter(b => b.status === 'cancelled').length
    // Handle multiple fare formats: pricing.totalFare, fare.totalFare, fare.total, totalFare, or fare as number
    const totalFare = bookings.reduce((sum, b) => {
      const fareValue = 
        b.pricing?.totalFare || 
        (typeof b.fare === 'object' ? (b.fare.totalFare || b.fare.total) : null) ||
        b.totalFare ||
        (typeof b.fare === 'number' ? b.fare : 0) ||
        0
      return sum + fareValue
    }, 0)
    const averageFare = total > 0 ? totalFare / total : 0

    return {
      total,
      completed,
      cancelled,
      averageFare,
      totalFare
    }
  }, [bookings])

  // Handle customer actions
  const handleDeleteCustomer = async () => {
    if (!customer) return

    try {
      const response = await customerService.deleteCustomer(customer.id)
      
      if (response.success) {
        navigate('/customers')
      } else {
        setError(response.error?.message || 'Failed to delete customer')
      }
    } catch (err) {
      setError('Failed to delete customer')
      console.error('Error deleting customer:', err)
    }
  }

  const handleBanCustomer = async () => {
    if (!customer) return

    try {
      const response = await customerService.banCustomer(customer.id, actionReason)
      
      if (response.success) {
        await loadCustomer()
        setBanDialogOpen(false)
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
    if (!customer) return

    try {
      const status = customer.accountStatus === 'suspended' ? 'active' : 'suspended'
      const response = await customerService.updateCustomerStatus(customer.id, status, actionReason)
      
      if (response.success) {
        await loadCustomer()
        setSuspendDialogOpen(false)
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

  // Get booking status color
  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'in_progress': return 'info'
      case 'cancelled': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  // Get vehicle type icon
  const getVehicleTypeIcon = (type?: string) => {
    switch (type) {
      case 'car': return <CarIcon />
      case 'bike': return <BikeIcon />
      case 'taxi': return <TaxiIcon />
      case 'bus': return <BusIcon />
      case 'train': return <TrainIcon />
      case 'flight': return <FlightIcon />
      case 'walk': return <WalkIcon />
      default: return <CarIcon />
    }
  }

  useEffect(() => {
    loadCustomer()
    loadBookings()
  }, [id])

  useEffect(() => {
    if (editNameDialogOpen && customer) {
      setNewName(customer.name || customer.personalInfo?.name || '')
    }
  }, [editNameDialogOpen, customer])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Customer not found</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/customers" onClick={(e) => { e.preventDefault(); navigate('/customers') }}>
          Customers
        </Link>
        <Typography color="text.primary">
          {customer.name || customer.personalInfo?.name || 'Customer Details'}
        </Typography>
      </Breadcrumbs>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Customer Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ width: 80, height: 80 }}>
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="h1">
                    {customer.name || customer.personalInfo?.name || 'Unknown Customer'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                    Customer ID: {customer.id}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      icon={getStatusIcon(customer.accountStatus)}
                      label={customer.accountStatus || 'Unknown'}
                      color={getStatusColor(customer.accountStatus)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Member since {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<BlockIcon />}
                  onClick={() => setSuspendDialogOpen(true)}
                  color={customer.accountStatus === 'suspended' ? 'success' : 'warning'}
                >
                  {customer.accountStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
                </Button>
                {/* Wallet button removed - no wallet system for customers */}
                <Button
                  variant="outlined"
                  startIcon={<BlockIcon />}
                  onClick={() => setBanDialogOpen(true)}
                  color="error"
                >
                  Ban Customer
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  color="error"
                >
                  Delete Customer
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
            <Tab label="Profile Information" />
            <Tab label="Booking History" />
            {/* Wallet tab removed - no wallet system for customers */}
          </Tabs>
        </Box>

        {/* Profile Information Tab */}
        {selectedTab === 0 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Personal Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="text.secondary">
                            Full Name
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setEditNameDialogOpen(true)}
                            sx={{ ml: 'auto' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="body1">
                          {customer.name || customer.personalInfo?.name || 'Not provided'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email Address
                        </Typography>
                        <Typography variant="body1">
                          {customer.email || customer.personalInfo?.email || 'Not provided'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phone Number
                        </Typography>
                        <Typography variant="body1">
                          {customer.phone || customer.personalInfo?.phone || 'Not provided'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Date of Birth
                        </Typography>
                        <Typography variant="body1">
                          {customer.personalInfo?.dateOfBirth || 'Not provided'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Address
                        </Typography>
                        <Typography variant="body1">
                          {customer.personalInfo?.address || 'Not provided'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Account Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Account Status
                        </Typography>
                        <Chip
                          icon={getStatusIcon(customer.accountStatus)}
                          label={customer.accountStatus || 'Unknown'}
                          color={getStatusColor(customer.accountStatus)}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Registration Date
                        </Typography>
                        <Typography variant="body1">
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleString() : 'Not available'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body1">
                          {customer.updatedAt ? new Date(customer.updatedAt).toLocaleString() : 'Not available'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Bookings
                        </Typography>
                        <Typography variant="body1">
                          {customer.bookingsCount || 0} bookings
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Booking History Tab */}
        {selectedTab === 1 && (
          <CardContent>
            {/* Summary Metrics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {bookingSummary.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Bookings
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {bookingSummary.completed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {bookingSummary.cancelled}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cancelled
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    ₹{bookingSummary.averageFare.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Fare
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Filters */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={bookingStatusFilter}
                  label="Status"
                  onChange={(e) => {
                    setBookingStatusFilter(e.target.value)
                    if (e.target.value !== 'all') {
                      loadBookings(e.target.value)
                    } else {
                      loadBookings()
                    }
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="From Date"
                type="date"
                value={bookingDateFrom}
                onChange={(e) => setBookingDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                size="small"
                label="To Date"
                type="date"
                value={bookingDateTo}
                onChange={(e) => setBookingDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setBookingStatusFilter('all')
                  setBookingDateFrom('')
                  setBookingDateTo('')
                  loadBookings()
                }}
              >
                Clear Filters
              </Button>
            </Box>

            <Typography variant="h6" gutterBottom>
              Booking History ({filteredBookings.length} of {bookings.length} bookings)
            </Typography>
            {filteredBookings.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Booking ID</TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Fare</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            #{booking.id.substring(0, 8)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              <LocationIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              {booking.pickupLocation?.address || booking.pickup?.address || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                              <LocationIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              {booking.dropoffLocation?.address || booking.dropoff?.address || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getVehicleTypeIcon(booking.vehicleType)}
                            <Typography variant="body2">
                              {booking.vehicleType || 'Car'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={booking.status}
                            color={getBookingStatusColor(booking.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            ₹{(() => {
                              const fareValue = 
                                booking.pricing?.totalFare || 
                                (typeof booking.fare === 'object' ? (booking.fare.totalFare || booking.fare.total) : null) ||
                                booking.totalFare ||
                                (typeof booking.fare === 'number' ? booking.fare : 0) ||
                                0
                              return fareValue
                            })()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/bookings?bookingId=${booking.id}`)}
                            title="View in Booking Management"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {bookings.length === 0 
                    ? 'No bookings found for this customer.'
                    : 'No bookings match the selected filters.'}
                </Typography>
              </Box>
            )}
          </CardContent>
        )}

        {/* Wallet tab content removed - no wallet system for customers */}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullScreen={isMobileDialog}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this customer? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Customer: {customer.name || customer.personalInfo?.name}
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
          {customer.accountStatus === 'suspended' ? 'Unsuspend' : 'Suspend'} Customer
        </DialogTitle>
        <DialogContent>
          <Typography>
            {customer.accountStatus === 'suspended' 
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
            color={customer.accountStatus === 'suspended' ? 'success' : 'warning'} 
            variant="contained"
          >
            {customer.accountStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog open={editNameDialogOpen} onClose={() => setEditNameDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobileDialog}>
        <DialogTitle>Edit Customer Name</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Customer Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            margin="normal"
            required
            placeholder="Enter new customer name"
            helperText="This will update the customer's display name"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditNameDialogOpen(false)
            setNewName('')
          }} disabled={updatingName}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (customer && newName.trim()) {
                setUpdatingName(true)
                try {
                  const response = await customerService.updateCustomerName(customer.id, newName.trim())
                  if (response.success) {
                    setCustomer({ ...customer, name: newName.trim() })
                    setEditNameDialogOpen(false)
                    setNewName('')
                  } else {
                    alert(response.error?.message || 'Failed to update customer name')
                  }
                } catch (error: any) {
                  alert(error.message || 'Failed to update customer name')
                } finally {
                  setUpdatingName(false)
                }
              }
            }}
            variant="contained"
            disabled={!newName.trim() || updatingName}
          >
            {updatingName ? 'Updating...' : 'Update Name'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wallet dialog removed - no wallet system for customers */}
    </Box>
  )
}

export default CustomerDetail
