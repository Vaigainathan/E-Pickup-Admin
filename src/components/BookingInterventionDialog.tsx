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
} from '@mui/icons-material'
import { Booking } from '../types'
import { bookingService } from '../services/bookingService'
import { resolveErrorMessage } from '../services/errorHandlerService'

interface BookingInterventionDialogProps {
  open: boolean
  booking: Booking | null
  onClose: () => void
  onSuccess: () => void
}

type InterventionAction = 'cancel' | 'reassign'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && booking) {
      setAction('')
      setReason('')
      setError(null)
    }
  }, [open, booking])

  const handleSubmit = async () => {
    if (!booking || !action || !reason.trim()) {
      setError('Please select an action and provide a reason')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await bookingService.interveneBooking(booking.id, action, reason)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(resolveErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = () => {
    switch (action) {
      case 'reassign':
        return <AssignmentIcon />
      case 'cancel':
        return <CancelIcon />
      default:
        return <WarningIcon />
    }
  }

  const getActionDescription = () => {
    switch (action) {
      case 'reassign':
        return 'Clear the current driver assignment and send this booking back to driver search (pending).'
      case 'cancel':
        return 'Cancel this booking permanently.'
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
            #{booking.displayId ? String(booking.displayId).padStart(5, '0') : booking.id.substring(0, 8)}
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
                <MenuItem value="reassign">
                  <Box display="flex" alignItems="center" gap={1}>
                    <AssignmentIcon fontSize="small" />
                    Send back to driver search
                  </Box>
                </MenuItem>
                <MenuItem value="cancel">
                  <Box display="flex" alignItems="center" gap={1}>
                    <CancelIcon fontSize="small" />
                    Cancel booking
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

        {action === 'cancel' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="600">
              Warning: Cancelling this booking will permanently mark it as cancelled. This action cannot be undone.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} disabled={loading}>
          Close
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
