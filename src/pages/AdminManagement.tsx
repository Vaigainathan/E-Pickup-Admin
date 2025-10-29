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
  Tabs,
  Tab,
  useMediaQuery,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Support as SupportIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { errorHandlerService } from '../services/errorHandlerService'
import { apiService } from '../services/apiService'
import { userTraceabilityService } from '../services/userTraceabilityService'

interface AdminUser {
  uid: string
  email: string
  displayName: string
  role: 'super_admin'
  permissions: string[]
  lastLogin?: string
  createdAt: string
  isEmailVerified: boolean
  isActive?: boolean
}

const AdminManagement: React.FC = () => {
  // Responsive hooks
  const isMobileDialog = useMediaQuery('(max-width: 600px)')
  
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'super_admin' as AdminUser['role'],
    permissions: [] as string[]
  })
  const [activeTab, setActiveTab] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searchLoading, setSearchLoading] = useState(false)

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
      
      if (response.success && response.data) {
        setAdmins(Array.isArray(response.data) ? response.data : [])
      } else {
        // ✅ FIX: Check if endpoint doesn't exist and provide fallback
        if (response.error?.code === 'NOT_FOUND' || response.error?.status === 404) {
          console.warn('Admin endpoint not found, using empty list')
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

  const handleOpenDialog = (admin?: AdminUser) => {
    if (admin) {
      setEditingAdmin(admin)
      setFormData({
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        permissions: admin.permissions
      })
    } else {
      setEditingAdmin(null)
      setFormData({
        email: '',
        displayName: '',
        role: 'super_admin',
        permissions: []
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingAdmin(null)
    setFormData({
      email: '',
      displayName: '',
      role: 'super_admin',
      permissions: []
    })
  }

  const handleSaveAdmin = async () => {
    try {
      let response
      
      if (editingAdmin) {
        response = await apiService.put(`/api/admin/admins/${editingAdmin.uid}`, formData)
      } else {
        response = await apiService.post('/api/admin/admins', formData)
      }
      
      if (response.success) {
        setOpenDialog(false)
        loadAdmins()
      } else {
        throw new Error(response.error?.message || 'Failed to save admin')
      }
    } catch (err: any) {
      setError(errorHandlerService.handleError(err).message)
    }
  }

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (window.confirm(`Are you sure you want to delete ${admin.displayName}?`)) {
      try {
        const response = await apiService.delete(`/api/admin/admins/${admin.uid}`)
        
        if (response.success) {
          loadAdmins()
        } else {
          throw new Error(response.error?.message || 'Failed to delete admin')
        }
      } catch (err: any) {
        setError(errorHandlerService.handleError(err).message)
      }
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }

    setSearchLoading(true)
    try {
      const results = await userTraceabilityService.getComprehensiveTraceability(searchQuery.trim())
      setSearchResults(results)
      console.log('🔍 Search results:', results)
    } catch (err: any) {
      setError(errorHandlerService.handleError(err).message)
    } finally {
      setSearchLoading(false)
    }
  }

  const getRoleIcon = (_role: AdminUser['role']) => {
    // All admins are super_admin with full access
    return <AdminIcon color="primary" />
  }

  const getRoleColor = (_role: AdminUser['role']) => {
    // All admins are super_admin with full access
    return 'primary'
  }

  const getRoleDescription = (_role: AdminUser['role']) => {
    // All admins are super_admin with full access
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
            onClick={() => handleOpenDialog()}
            disabled={currentUser?.role !== 'super_admin'}
          >
            Add Admin
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Admin Users" />
            <Tab label="User Traceability" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <>
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

              {/* Admin Table */}
              <Grid item xs={12}>
                <Paper>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Admin</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Permissions</TableCell>
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
                                  {admin.displayName.charAt(0).toUpperCase()}
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
                                {admin.permissions.length} permissions
                              </Typography>
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
                                label={admin.isEmailVerified ? 'Verified' : 'Unverified'}
                                color={admin.isEmailVerified ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() => handleOpenDialog(admin)}
                                disabled={currentUser?.role !== 'super_admin'}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDeleteAdmin(admin)}
                                disabled={currentUser?.role !== 'super_admin' || admin.uid === currentUser?.uid}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}

        {activeTab === 1 && (
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                User Traceability Search
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Search for users by Firebase UID, role-based UID, or phone number to trace across all roles and collections.
              </Typography>
              <Box display="flex" gap={2} alignItems="center">
                <TextField
                  fullWidth
                  label="Search by UID or Phone Number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Firebase UID, role-based UID, or phone number"
                />
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  disabled={searchLoading || !searchQuery.trim()}
                >
                  {searchLoading ? <CircularProgress size={20} /> : 'Search'}
                </Button>
              </Box>
            </Paper>

            {searchResults && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Search Results
                </Typography>
                
                {searchResults.firebaseUID && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Found by Firebase UID
                    </Typography>
                    <Card>
                      <CardContent>
                        <Typography variant="body2">
                          <strong>Firebase UID:</strong> {searchResults.firebaseUID.firebaseUID}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Role-based UID:</strong> {searchResults.firebaseUID.roleBasedUID || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Phone:</strong> {searchResults.firebaseUID.phone}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Roles:</strong> {searchResults.firebaseUID.roles.join(', ')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Collections:</strong> {searchResults.firebaseUID.foundInCollections.join(', ')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {searchResults.roleBasedUID && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Found by Role-based UID
                    </Typography>
                    <Card>
                      <CardContent>
                        <Typography variant="body2">
                          <strong>Firebase UID:</strong> {searchResults.roleBasedUID.firebaseUID}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Role-based UID:</strong> {searchResults.roleBasedUID.roleBasedUID}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Phone:</strong> {searchResults.roleBasedUID.phone}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Roles:</strong> {searchResults.roleBasedUID.roles.join(', ')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Collections:</strong> {searchResults.roleBasedUID.foundInCollections.join(', ')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {searchResults.phoneNumber && searchResults.phoneNumber.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Found by Phone Number ({searchResults.phoneNumber.length} results)
                    </Typography>
                    {searchResults.phoneNumber.map((result: any, index: number) => (
                      <Card key={index} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="body2">
                            <strong>Firebase UID:</strong> {result.firebaseUID}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Role-based UID:</strong> {result.roleBasedUID}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Phone:</strong> {result.phone}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Roles:</strong> {result.roles.join(', ')}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Collections:</strong> {result.foundInCollections.join(', ')}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}

                {!searchResults.firebaseUID && !searchResults.roleBasedUID && (!searchResults.phoneNumber || searchResults.phoneNumber.length === 0) && (
                  <Alert severity="info">
                    No users found matching the search criteria.
                  </Alert>
                )}
              </Paper>
            )}
          </Box>
        )}

        {/* Add/Edit Admin Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth fullScreen={isMobileDialog}>
          <DialogTitle>
            {editingAdmin ? 'Edit Admin User' : 'Add New Admin User'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
                disabled={!!editingAdmin}
              />
              <TextField
                fullWidth
                label="Display Name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminUser['role'] })}
                  label="Role"
                >
                  <MenuItem value="super_admin">Super Admin (Full Access)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {getRoleDescription(formData.role)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveAdmin} variant="contained">
              {editingAdmin ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

export default AdminManagement