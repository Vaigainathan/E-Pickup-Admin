import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Avatar,
  useMediaQuery,
} from '@mui/material'
import {
  Add as AddIcon,
  Block as BlockIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Support as SupportIcon,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { errorHandlerService, mapError } from '../services/errorHandlerService'
import { apiService } from '../services/apiService'
interface AdminUser {
  uid: string
  email: string
  displayName: string
  role: 'super_admin' | 'support'
  permissions: string[]
  lastLogin?: string
  createdAt: string
  isEmailVerified: boolean
  isActive?: boolean
}

/** marketplace-dev contract: array of admins or `{ admins: [] }` / nested `data`; shape otherwise unknown on old staging */
function normalizeAdminUser(raw: Record<string, unknown>): AdminUser {
  const role = raw.role === 'support' ? 'support' : 'super_admin'
  const displayName =
    (typeof raw.displayName === 'string' && raw.displayName) ||
    (typeof raw.name === 'string' && raw.name) ||
    (typeof raw.email === 'string' && raw.email) ||
    'Admin'
  return {
    uid: String(raw.uid ?? raw.id ?? ''),
    email: typeof raw.email === 'string' ? raw.email : '',
    displayName,
    role,
    permissions: Array.isArray(raw.permissions) ? (raw.permissions as string[]) : [],
    lastLogin: typeof raw.lastLogin === 'string' ? raw.lastLogin : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    isEmailVerified: raw.isEmailVerified === true || raw.isEmailVerified === 'true',
    isActive: raw.isActive !== false,
  }
}

function parseAdminsList(payload: unknown): AdminUser[] | null {
  if (payload == null) return null
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeAdminUser((item ?? {}) as Record<string, unknown>))
  }
  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (Array.isArray(record.admins)) {
      return record.admins.map((item) => normalizeAdminUser((item ?? {}) as Record<string, unknown>))
    }
    if (Array.isArray(record.data)) {
      return record.data.map((item) => normalizeAdminUser((item ?? {}) as Record<string, unknown>))
    }
    if (record.data && typeof record.data === 'object') {
      const inner = record.data as Record<string, unknown>
      if (Array.isArray(inner.admins)) {
        return inner.admins.map((item) => normalizeAdminUser((item ?? {}) as Record<string, unknown>))
      }
      if (Array.isArray(inner.data)) {
        return inner.data.map((item) => normalizeAdminUser((item ?? {}) as Record<string, unknown>))
      }
    }
  }
  return null
}

const AdminManagement: React.FC = () => {
  // Responsive hooks
  const isMobileDialog = useMediaQuery('(max-width: 600px)')
  const isMobile = useMediaQuery('(max-width: 600px)')
  
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'support' as AdminUser['role'],
    temporaryPassword: '',
  })

  const { user: currentUser } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // ✅ FIX: Use apiService with proper error handling
      const response = await apiService.get('/api/admin/admins')
      
      if (response.success) {
        const parsed = parseAdminsList(response.data)
        if (parsed) {
          setAdmins(parsed.filter((a) => a.uid))
        } else if (response.data == null) {
          setAdmins([])
        } else {
          setAdmins([])
          setError('Unexpected admin list format from server. Try again or contact support.')
        }
      } else {
        if (response.error?.code === 'NOT_FOUND' || response.error?.code === '404') {
          setAdmins([])
        } else {
          throw new Error(response.error?.message || 'Failed to load admins')
        }
      }
    } catch (err: any) {
      console.error('Error loading admins:', err)
      // ✅ FIX: Don't show error if it's just that the endpoint doesn't exist
      if (err.message?.includes('404') || err.message?.includes('NOT_FOUND')) {
        console.warn('Admin endpoint not available, initializing with empty list')
        setAdmins([])
        setError(null)
      } else {
        const errorInfo = errorHandlerService.handleError(err)
        setError(errorInfo.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = () => {
    setFormData({
      email: '',
      displayName: '',
      role: 'support',
      temporaryPassword: '',
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setFormData({
      email: '',
      displayName: '',
      role: 'support',
      temporaryPassword: '',
    })
  }

  const handleSaveAdmin = async () => {
    try {
      const response = await apiService.post('/api/admin/admins', {
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        temporaryPassword: formData.temporaryPassword,
      })

      if (response.success) {
        setOpenDialog(false)
        loadAdmins()
      } else {
        setError(mapError({ code: response.error?.code, message: response.error?.message }))
      }
    } catch (err: unknown) {
      setError(mapError(err))
    }
  }

  const handleDisableAdmin = async (admin: AdminUser) => {
    if (window.confirm(`Disable admin account for ${admin.displayName}?`)) {
      try {
        const putResponse = await apiService.put(`/api/admin/admins/${admin.uid}`, { isActive: false })
        const response =
          putResponse.success
            ? putResponse
            : await apiService.delete(`/api/admin/admins/${admin.uid}`)

        if (response.success) {
          loadAdmins()
        } else {
          throw new Error(response.error?.message || 'Failed to disable admin')
        }
      } catch (err: any) {
        setError(errorHandlerService.handleError(err).message)
      }
    }
  }

  const getRoleIcon = (role: AdminUser['role']) => {
    return role === 'support' ? <SupportIcon color="info" /> : <AdminIcon color="primary" />
  }

  const getRoleColor = (role: AdminUser['role']) => {
    return role === 'support' ? 'info' : 'primary'
  }

  const getRoleDescription = (role: AdminUser['role']) => {
    if (role === 'support') {
      return 'Support operations without super-admin configuration access'
    }
    return 'Full system access and user management'
  }

  // ✅ FIX: Show loading state, but don't block on error
  if (loading && admins.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Admin Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            disabled={currentUser?.role !== 'super_admin'}
          >
            Add Admin
          </Button>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => loadAdmins()}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
              {/* Admin Stats Cards */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <AdminIcon color="primary" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="h6">Total Admins</Typography>
                        <Typography variant="h4">
                          {admins.length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <PersonIcon color="secondary" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="h6">Active Admins</Typography>
                        <Typography variant="h4">
                          {admins.filter(a => a.isActive !== false).length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <SupportIcon color="info" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="h6">Super Admins</Typography>
                        <Typography variant="h4">
                          {admins.filter(a => a.role === 'super_admin').length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Admin Table/Cards */}
              <Grid item xs={12}>
                <Paper>
                  {isMobile ? (
                    // Mobile Card View
                    <Box sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        {admins.map((admin) => (
                          <Grid item xs={12} key={admin.uid}>
                            <Card variant="outlined" sx={{ p: 2 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                                <Box display="flex" alignItems="center" gap={1.5} flex={1}>
                                  <Avatar>
                                    {(admin.displayName?.charAt(0) || '?').toUpperCase()}
                                  </Avatar>
                                  <Box flex={1}>
                                    <Typography variant="subtitle2" fontWeight="600">
                                      {admin.displayName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {admin.email}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box display="flex" gap={0.5}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDisableAdmin(admin)}
                                    disabled={
                                      currentUser?.role !== 'super_admin' ||
                                      admin.uid === currentUser?.uid ||
                                      admin.isActive === false
                                    }
                                    color="error"
                                  >
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                              <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  {getRoleIcon(admin.role)}
                                  <Chip
                                    label={admin.role.replace('_', ' ')}
                                    color={getRoleColor(admin.role) as any}
                                    size="small"
                                  />
                                </Box>
                                <Chip
                                  label={admin.isActive === false ? 'Disabled' : 'Active'}
                                  color={admin.isActive === false ? 'default' : 'success'}
                                  size="small"
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                Last Login: {admin.lastLogin 
                                  ? new Date(admin.lastLogin).toLocaleDateString()
                                  : 'Never'
                                }
                              </Typography>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ) : (
                    // Desktop Table View
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Admin</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Last Login</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {admins.map((admin) => (
                            <TableRow key={admin.uid}>
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  <Avatar sx={{ mr: 2 }}>
                                    {(admin.displayName?.charAt(0) || '?').toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle2">
                                      {admin.displayName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {admin.email}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  {getRoleIcon(admin.role)}
                                  <Chip
                                    label={admin.role.replace('_', ' ')}
                                    color={getRoleColor(admin.role) as any}
                                    size="small"
                                    sx={{ ml: 1 }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {admin.lastLogin 
                                    ? new Date(admin.lastLogin).toLocaleDateString()
                                    : 'Never'
                                  }
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={admin.isActive === false ? 'Disabled' : 'Active'}
                                  color={admin.isActive === false ? 'default' : 'success'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  onClick={() => handleDisableAdmin(admin)}
                                  disabled={
                                    currentUser?.role !== 'super_admin' ||
                                    admin.uid === currentUser?.uid ||
                                    admin.isActive === false
                                  }
                                  color="error"
                                  title="Disable admin"
                                >
                                  <BlockIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </Grid>
            </Grid>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth fullScreen={isMobileDialog}>
          <DialogTitle>Add New Admin User</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Display Name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Temporary Password"
                type="password"
                value={formData.temporaryPassword}
                onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                margin="normal"
                required
                inputProps={{ minLength: 8 }}
                helperText="At least 8 characters (sent as temporaryPassword to the server)"
                error={formData.temporaryPassword.length > 0 && formData.temporaryPassword.length < 8}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminUser['role'] })}
                  label="Role"
                >
                  <MenuItem value="super_admin">Super Admin (Full Access)</MenuItem>
                  <MenuItem value="support">Support</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {getRoleDescription(formData.role)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSaveAdmin}
              variant="contained"
              disabled={
                !formData.email ||
                !formData.displayName ||
                formData.temporaryPassword.length < 8
              }
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

export default AdminManagement