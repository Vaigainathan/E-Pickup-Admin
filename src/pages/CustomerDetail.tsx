import React, { useState, useEffect } from 'react'
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
} from '@mui/icons-material'
import { customerService } from '../services/customerService'
import { useParams, useNavigate } from 'react-router-dom'

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
  status: string
  fare: number
  createdAt: Date
  updatedAt: Date
  vehicleType?: string
  driverName?: string
  customerName?: string
}

const CustomerDetail: React.FC = () => {
  // const theme = useTheme()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  // const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // State management
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
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
  const loadBookings = async () => {
    if (!id) return

    try {
      const response = await customerService.getCustomerBookings(id)
      
      if (response.success && response.data) {
        setBookings(response.data)
      }
    } catch (err) {
      console.error('Error loading bookings:', err)
    }
  }

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
                        <Typography variant="body2" color="text.secondary">
                          Full Name
                        </Typography>
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
            <Typography variant="h6" gutterBottom>
              Booking History ({bookings.length} bookings)
            </Typography>
            {bookings.length > 0 ? (
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {booking.id.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              <LocationIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              {booking.pickupLocation.address}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <LocationIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              {booking.dropoffLocation.address}
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
                          <Typography variant="body2">
                            ₹{booking.fare}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No bookings found for this customer.
                </Typography>
              </Box>
            )}
          </CardContent>
        )}

        {/* Wallet tab content removed - no wallet system for customers */}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
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
      <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)}>
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
      <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)}>
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

      {/* Wallet dialog removed - no wallet system for customers */}
    </Box>
  )
}

export default CustomerDetail
