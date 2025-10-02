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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  MenuItem,
  CircularProgress,
} from '@mui/material'
import {
  Support as SupportIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Reply as ReplyIcon,
  CheckCircle as CheckCircleIcon,
  // Cancel as CancelIcon, // Removed unused import
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../hooks/redux'
import { RootState } from '../store'
import { fetchSupportTickets, updateTicketStatus, sendMessage, setPagination } from '../store/slices/supportSlice' // Removed unused setFilters
import { SupportTicket } from '../types'

const SupportTickets: React.FC = () => {
  const dispatch = useAppDispatch()
  const { tickets, loading, pagination, filters, stats } = useSelector((state: RootState) => state.support)
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    // Guard against infinite loops by checking if data is already loading
    if (!loading) {
      dispatch(fetchSupportTickets({ pagination: { ...pagination, offset: (pagination.page - 1) * pagination.limit }, filters }))
    }
  }, [dispatch, pagination.page, pagination.limit, filters.status, filters.priority, filters.category, loading])

  const handleReply = async () => {
    if (selectedTicket && replyMessage.trim()) {
      try {
        await dispatch(sendMessage({
          ticketId: selectedTicket.id,
          message: replyMessage,
        }))
        setReplyDialogOpen(false)
        setReplyMessage('')
      } catch (error) {
        console.error('Error sending reply:', error)
      }
    }
  }

  const handleStatusUpdate = async () => {
    if (selectedTicket && newStatus) {
      try {
        await dispatch(updateTicketStatus({
          ticketId: selectedTicket.id,
          status: newStatus
        }))
        setStatusDialogOpen(false)
        setSelectedTicket(null)
        setNewStatus('')
      } catch (error) {
        console.error('Error updating ticket status:', error)
      }
    }
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    // Only update if page actually changed
    if (page !== pagination.page) {
      dispatch(setPagination({ page, limit: pagination.limit, total: pagination.total, totalPages: pagination.totalPages, offset: (page - 1) * pagination.limit }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'error'
      case 'in_progress': return 'warning'
      case 'resolved': return 'success'
      case 'closed': return 'default'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'primary'
      case 'billing': return 'secondary'
      case 'general': return 'info'
      case 'complaint': return 'error'
      case 'suggestion': return 'success'
      default: return 'default'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const statusOptions = ['open', 'in_progress', 'resolved', 'closed']

  // Show loading state
  if (loading && tickets.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Support Tickets...
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Support Tickets
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => {/* Implement filter dialog */}}
            disabled={loading}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => {
              if (!loading) {
                dispatch(fetchSupportTickets({ pagination: { ...pagination, offset: (pagination.page - 1) * pagination.limit }, filters }))
              }
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Support Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Tickets
                  </Typography>
                  <Typography variant="h4" component="h2" fontWeight="bold">
                    {stats.total}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <SupportIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Open Tickets
                  </Typography>
                  <Typography variant="h4" component="h2" fontWeight="bold" color="error.main">
                    {stats.open}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56 }}>
                  <SupportIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    In Progress
                  </Typography>
                  <Typography variant="h4" component="h2" fontWeight="bold" color="warning.main">
                    {stats.inProgress}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <SupportIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Resolved
                  </Typography>
                  <Typography variant="h4" component="h2" fontWeight="bold" color="success.main">
                    {stats.resolved}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tickets Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Support Tickets ({tickets.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ticket ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets?.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        #{ticket.ticketId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {ticket.userInfo?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {ticket.userInfo?.email || 'No email'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {ticket.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.category}
                        color={getCategoryColor(ticket.category) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.priority}
                        color={getPriorityColor(ticket.priority) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status}
                        color={getStatusColor(ticket.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTime(ticket.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setViewDialogOpen(true)
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reply">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setReplyDialogOpen(true)
                          }}
                        >
                          <ReplyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update Status">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setNewStatus(ticket.status)
                            setStatusDialogOpen(true)
                          }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Support Ticket Details</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Ticket Information</Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Ticket ID"
                      secondary={`#${selectedTicket.ticketId}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Subject"
                      secondary={selectedTicket.subject}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Category"
                      secondary={selectedTicket.category}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Priority"
                      secondary={selectedTicket.priority}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={selectedTicket.status}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>User Information</Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Name"
                      secondary={selectedTicket.userInfo?.name || 'Unknown User'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Email"
                      secondary={selectedTicket.userInfo?.email || 'No email'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Phone"
                      secondary={selectedTicket.userInfo?.phone || 'No phone'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="User Type"
                      secondary={selectedTicket.userType}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Description</Typography>
                <Typography variant="body2">
                  {selectedTicket.description}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Messages</Typography>
                <List>
                  {selectedTicket?.messages?.map((message, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: message.senderType === 'admin' ? 'primary.main' : 'grey.500' }}>
                          {message.senderName.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={message.senderName}
                        secondary={
                          <Box>
                            <Typography variant="body2" mb={1}>
                              {message.message}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatTime(message.timestamp)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reply to Ticket</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box>
              <Typography variant="body1" mb={2}>
                Ticket: #{selectedTicket.ticketId} - {selectedTicket.subject}
              </Typography>
              <TextField
                fullWidth
                label="Reply Message"
                multiline
                rows={6}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                margin="normal"
                required
                placeholder="Type your reply here..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReply}
            variant="contained"
            disabled={!replyMessage.trim()}
          >
            Send Reply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Ticket Status</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box>
              <Typography variant="body1" mb={2}>
                Ticket: #{selectedTicket.ticketId} - {selectedTicket.subject}
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
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!newStatus || newStatus === selectedTicket?.status}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SupportTickets
