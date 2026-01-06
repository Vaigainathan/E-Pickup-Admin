import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  AttachMoney as AttachMoneyIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material'
import { Booking } from '../types'
import { bookingService } from '../services/bookingService'

interface BookingInterventionDialogProps {
  open: boolean
  booking: Booking | null
  onClose: () => void
  onSuccess: () => void
}

type InterventionAction = 'reassign_driver' | 'cancel_booking' | 'update_fare' | 'send_notification'

const BookingInterventionDialog: React.FC<BookingInterventionDialogProps> = ({
  open,
  booking,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [action, setAction] = useState<InterventionAction | ''>('')
  const [reason, setReason] = useState('')
  const [newDriverId, setNewDriverId] = useState('')
  const [newFare, setNewFare] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableDrivers, setAvailableDrivers] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (open && booking) {
      // Reset form when dialog opens
      setAction('')
      setReason('')
      setNewDriverId('')
      setNewFare('')
      setNotificationMessage('')
      setError(null)
      
      // If action is reassign_driver, fetch available drivers
      if (action === 'reassign_driver') {
        // TODO: Fetch available drivers from API
        // For now, using empty array
        setAvailableDrivers([])
      }
      
      // Set default fare if updating fare - handle multiple fare formats
      if (action === 'update_fare') {
        const fareValue = 
          booking.pricing?.totalFare || 
          (typeof booking.fare === 'object' ? (booking.fare.totalFare || booking.fare.total) : null) ||
          booking.totalFare ||
          (typeof booking.fare === 'number' ? booking.fare : null) ||
          0
        setNewFare(fareValue.toString())
      }
    }
  }, [open, booking, action])

  const handleSubmit = async () => {
    if (!booking || !action || !reason.trim()) {
      setError('Please select an action and provide a reason')
      return
    }

    // Validate action-specific fields
    if (action === 'reassign_driver' && !newDriverId.trim()) {
      setError('Please select a driver to reassign')
      return
    }

    if (action === 'update_fare') {
      const fareValue = parseFloat(newFare)
      if (isNaN(fareValue) || fareValue <= 0) {
        setError('Please enter a valid fare amount')
        return
      }
    }

    if (action === 'send_notification' && !notificationMessage.trim()) {
      setError('Please enter a notification message')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const details: any = {}
      
      if (action === 'reassign_driver') {
        details.newDriverId = newDriverId
      } else if (action === 'update_fare') {
        details.newFare = parseFloat(newFare)
      } else if (action === 'send_notification') {
        details.notificationMessage = notificationMessage
      }

      await bookingService.interveneBooking(
        booking.id,
        action as InterventionAction,
        reason,
        details
      )

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to intervene in booking')
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = () => {
    switch (action) {
      case 'reassign_driver':
        return <AssignmentIcon />
      case 'cancel_booking':
        return <CancelIcon />
      case 'update_fare':
        return <AttachMoneyIcon />
      case 'send_notification':
        return <NotificationsIcon />
      default:
        return <WarningIcon />
    }
  }

  const getActionDescription = () => {
    switch (action) {
      case 'reassign_driver':
        return 'Reassign this booking to a different driver'
      case 'cancel_booking':
        return 'Cancel this booking permanently'
      case 'update_fare':
        return 'Update the fare amount for this booking'
      case 'send_notification':
        return 'Send a notification to the customer and/or driver'
      default:
        return 'Select an intervention action'
    }
  }

  if (!booking) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ background: theme.palette.warning.main, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        {getActionIcon()}
        Booking Intervention
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box mb={3}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Booking ID
          </Typography>
          <Typography variant="h6" fontWeight="600">
            #{booking.id.substring(0, 8)}
          </Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Status
          </Typography>
          <Typography variant="body1">
            {booking.status || 'Unknown'}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Intervention Action</InputLabel>
              <Select
                value={action}
                onChange={(e) => setAction(e.target.value as InterventionAction)}
                label="Intervention Action"
              >
                <MenuItem value="reassign_driver">
                  <Box display="flex" alignItems="center" gap={1}>
                    <AssignmentIcon fontSize="small" />
                    Reassign Driver
                  </Box>
                </MenuItem>
                <MenuItem value="cancel_booking">
                  <Box display="flex" alignItems="center" gap={1}>
                    <CancelIcon fontSize="small" />
                    Cancel Booking
                  </Box>
                </MenuItem>
                <MenuItem value="update_fare">
                  <Box display="flex" alignItems="center" gap={1}>
                    <AttachMoneyIcon fontSize="small" />
                    Update Fare
                  </Box>
                </MenuItem>
                <MenuItem value="send_notification">
                  <Box display="flex" alignItems="center" gap={1}>
                    <NotificationsIcon fontSize="small" />
                    Send Notification
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {action && (
            <Grid item xs={12}>
              <Alert severity="info" icon={getActionIcon()}>
                {getActionDescription()}
              </Alert>
            </Grid>
          )}

          {action === 'reassign_driver' && (
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Select Driver</InputLabel>
                <Select
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  label="Select Driver"
                >
                  {availableDrivers.length === 0 ? (
                    <MenuItem disabled>
                      <Typography variant="body2" color="text.secondary">
                        No available drivers found. Please fetch drivers from Driver Management.
                      </Typography>
                    </MenuItem>
                  ) : (
                    availableDrivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        {driver.name} ({driver.id.substring(0, 8)})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Note: You can manually enter a driver ID if needed
              </Typography>
              <TextField
                fullWidth
                margin="normal"
                label="Or Enter Driver ID"
                value={newDriverId}
                onChange={(e) => setNewDriverId(e.target.value)}
                placeholder="Enter driver ID"
              />
            </Grid>
          )}

          {action === 'update_fare' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                label="Current Fare"
                value={booking.fare || booking.pricing?.totalFare || 0}
                InputProps={{
                  readOnly: true,
                }}
                helperText="Current fare amount"
              />
              <TextField
                fullWidth
                margin="normal"
                label="New Fare Amount"
                type="number"
                value={newFare}
                onChange={(e) => setNewFare(e.target.value)}
                required
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Enter the new fare amount"
              />
            </Grid>
          )}

          {action === 'send_notification' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                label="Notification Message"
                multiline
                rows={4}
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                required
                placeholder="Enter the notification message to send to customer and/or driver"
                helperText="This message will be sent to the customer and driver"
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              margin="normal"
              label="Reason for Intervention"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="Explain why this intervention is necessary..."
              helperText="This reason will be logged for audit purposes"
            />
          </Grid>
        </Grid>

        {action === 'cancel_booking' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="600">
              Warning: Cancelling this booking will permanently mark it as cancelled. This action cannot be undone.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !action || !reason.trim()}
          color="warning"
          startIcon={loading ? <CircularProgress size={16} /> : getActionIcon()}
        >
          {loading ? 'Processing...' : 'Intervene'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BookingInterventionDialog

