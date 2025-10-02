import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  Visibility
} from '@mui/icons-material'
import { driverDataService, DriverDataEntry, DriverDataStats } from '../services/driverDataService'
// Using Material-UI theme colors instead of custom colors

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`driver-data-tabpanel-${index}`}
      aria-labelledby={`driver-data-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const DriverDataManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)
  const [entries, setEntries] = useState<DriverDataEntry[]>([])
  const [stats, setStats] = useState<DriverDataStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<DriverDataEntry | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [reviewComments, setReviewComments] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const tabLabels = ['Pending', 'Approved', 'Rejected']
  const tabStatuses: Array<'pending_verification' | 'approved' | 'rejected'> = [
    'pending_verification',
    'approved',
    'rejected'
  ]

  useEffect(() => {
    loadData()
  }, [tabValue])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [entriesResponse, statsResponse] = await Promise.all([
        driverDataService.getDriverDataEntriesByStatus(tabStatuses[tabValue] || 'pending_verification'),
        driverDataService.getDriverDataStats()
      ])
      
      setEntries(entriesResponse.entries)
      setStats(statsResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleViewEntry = (entry: DriverDataEntry) => {
    setSelectedEntry(entry)
    setViewDialogOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedEntry) return
    
    setActionLoading(true)
    try {
      await driverDataService.approveDriverDataEntry(selectedEntry.id, reviewComments)
      setApproveDialogOpen(false)
      setReviewComments('')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve entry')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedEntry || !rejectionReason.trim()) return
    
    setActionLoading(true)
    try {
      await driverDataService.rejectDriverDataEntry(selectedEntry.id, rejectionReason, reviewComments)
      setRejectDialogOpen(false)
      setRejectionReason('')
      setReviewComments('')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject entry')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_verification': return 'warning'
      case 'approved': return 'success'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
          Driver Data Management
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Review and verify driver vehicle details and documents
        </Typography>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Entries
                </Typography>
                <Typography variant="h4" sx={{ color: 'primary.main' }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Review
                </Typography>
                <Typography variant="h4" sx={{ color: 'warning.main' }}>
                  {stats.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Approved
                </Typography>
                <Typography variant="h4" sx={{ color: 'success.main' }}>
                  {stats.approved}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Approval Rate
                </Typography>
                <Typography variant="h4" sx={{ color: 'info.main' }}>
                  {stats.approvalRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="driver data tabs">
            {tabLabels.map((label, index) => {
              const count = stats ? 
                (index === 0 ? stats.pending : 
                 index === 1 ? stats.approved : 
                 stats.rejected) : 0;
              return (
                <Tab key={index} label={`${label} (${count})`} />
              );
            })}
          </Tabs>
        </Box>

        {/* Tab Panels */}
        {tabLabels.map((_label, index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Driver</TableCell>
                      <TableCell>Vehicle Details</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {entry.driverInfo?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {entry.driverInfo?.phone || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {entry.vehicleDetails.vehicleMake} {entry.vehicleDetails.vehicleModel}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {entry.vehicleDetails.vehicleNumber} • {entry.vehicleDetails.vehicleType}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={entry.status.replace('_', ' ').toUpperCase()}
                            color={getStatusColor(entry.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {formatDate(entry.submittedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewEntry(entry)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {entry.status === 'pending_verification' && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => {
                                      setSelectedEntry(entry)
                                      setApproveDialogOpen(true)
                                    }}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setSelectedEntry(entry)
                                      setRejectDialogOpen(true)
                                    }}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        ))}
      </Card>

      {/* View Entry Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Driver Data Entry Details
        </DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Driver Information</Typography>
                  <Typography><strong>Name:</strong> {selectedEntry.driverInfo?.name || 'N/A'}</Typography>
                  <Typography><strong>Email:</strong> {selectedEntry.driverInfo?.email || 'N/A'}</Typography>
                  <Typography><strong>Phone:</strong> {selectedEntry.driverInfo?.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Vehicle Details</Typography>
                  <Typography><strong>Type:</strong> {selectedEntry.vehicleDetails.vehicleType}</Typography>
                  <Typography><strong>Number:</strong> {selectedEntry.vehicleDetails.vehicleNumber}</Typography>
                  <Typography><strong>Make:</strong> {selectedEntry.vehicleDetails.vehicleMake}</Typography>
                  <Typography><strong>Model:</strong> {selectedEntry.vehicleDetails.vehicleModel}</Typography>
                  <Typography><strong>Year:</strong> {selectedEntry.vehicleDetails.vehicleYear}</Typography>
                  <Typography><strong>Color:</strong> {selectedEntry.vehicleDetails.vehicleColor}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Document Details</Typography>
                  <Typography><strong>License Number:</strong> {selectedEntry.vehicleDetails.licenseNumber}</Typography>
                  <Typography><strong>License Expiry:</strong> {selectedEntry.vehicleDetails.licenseExpiry}</Typography>
                  <Typography><strong>RC Number:</strong> {selectedEntry.vehicleDetails.rcNumber}</Typography>
                  <Typography><strong>Insurance Number:</strong> {selectedEntry.vehicleDetails.insuranceNumber}</Typography>
                  <Typography><strong>Insurance Expiry:</strong> {selectedEntry.vehicleDetails.insuranceExpiry}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Approve Driver Data Entry</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review Comments (Optional)"
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Driver Data Entry</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Rejection Reason *"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review Comments (Optional)"
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={actionLoading || !rejectionReason.trim()}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DriverDataManagement
