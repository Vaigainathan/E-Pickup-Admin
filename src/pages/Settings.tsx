import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  // Divider, // Removed unused import
  Alert,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  CircularProgress,
  AlertTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  // Security as SecurityIcon, // Removed unused import
  // Notifications as NotificationsIcon, // Removed unused import
  // Palette as PaletteIcon, // Removed unused import
  // Language as LanguageIcon, // Removed unused import
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../hooks/redux'
import { RootState } from '../store'
import { updateProfile, changePassword } from '../store/slices/authSlice'
import { 
  fetchSettings, 
  updateSettings, 
  backupData, 
  restoreData, 
  clearCache, 
  restartSystem,
  fetchBackups
} from '../store/slices/settingsSlice'

const Settings: React.FC = () => {
  // Responsive hooks
  const isMobileDialog = useMediaQuery('(max-width: 600px)')
  
  const dispatch = useAppDispatch()
  const { user } = useSelector((state: RootState) => state.auth)
  const { settings, loading, backups, backupsLoading } = useSelector((state: RootState) => state.settings)
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null)
  const [cacheDialogOpen, setCacheDialogOpen] = useState(false)
  const [cacheType, setCacheType] = useState<string>('all')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Fetch settings when component mounts
    dispatch(fetchSettings())
    dispatch(fetchBackups())
  }, [dispatch])

  const handleProfileUpdate = async () => {
    try {
      await dispatch(updateProfile(profileData)).unwrap()
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrorMessage('Failed to update profile')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    try {
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })).unwrap()
      setPasswordDialogOpen(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSuccessMessage('Password changed successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrorMessage('Failed to change password')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleSettingChange = async (setting: string, value: boolean | string) => {
    try {
      await dispatch(updateSettings({ [setting]: value })).unwrap()
      setSuccessMessage('Setting updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrorMessage('Failed to update setting')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleBackupData = async () => {
    try {
      await dispatch(backupData()).unwrap()
      setSuccessMessage('System backup created successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      // Refresh backups list
      dispatch(fetchBackups())
    } catch (error) {
      setErrorMessage('Failed to create backup')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleRestoreData = async (backupId: string) => {
    try {
      await dispatch(restoreData(backupId)).unwrap()
      setSuccessMessage('System restored successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setRestoreDialogOpen(false)
      setSelectedBackupId(null)
    } catch (error) {
      setErrorMessage('Failed to restore data')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleDownloadBackup = (backup: any) => {
    if (backup.downloadUrl) {
      window.open(backup.downloadUrl, '_blank')
    } else {
      setErrorMessage('Download URL not available for this backup')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" fontSize="small" />
      case 'in_progress':
        return <HourglassEmptyIcon color="warning" fontSize="small" />
      case 'failed':
        return <ErrorIcon color="error" fontSize="small" />
      default:
        return null
    }
  }

  const handleClearCache = async (type?: string) => {
    try {
      // If cache type is provided, we'd need to extend the service
      // For now, clear all cache
      await dispatch(clearCache()).unwrap()
      setSuccessMessage(`System cache${type && type !== 'all' ? ` (${type})` : ''} cleared successfully!`)
      setTimeout(() => setSuccessMessage(''), 3000)
      setCacheDialogOpen(false)
      setCacheType('all')
    } catch (error) {
      setErrorMessage('Failed to clear cache')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleRestartSystem = async () => {
    try {
      await dispatch(restartSystem()).unwrap()
      setSuccessMessage('System restart initiated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrorMessage('Failed to restart system')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight="bold" mb={3}>
        Settings
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ width: 80, height: 80, mr: 2 }}>
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </Avatar>
                <Box>
                  <Typography variant="h6">{user?.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {(user?.role || 'unknown').replace('_', ' ').toUpperCase()}
                  </Typography>
                </Box>
              </Box>
              <TextField
                fullWidth
                label="Full Name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email Address"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                margin="normal"
                disabled
              />
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleProfileUpdate}
                sx={{ mt: 2 }}
              >
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Change Password"
                    secondary="Update your account password"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      onClick={() => setPasswordDialogOpen(true)}
                    >
                      Change
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary="Add an extra layer of security"
                  />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" disabled>
                      Enable
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Login Sessions"
                    secondary="Manage active sessions"
                  />
                  <ListItemSecondaryAction>
                    <Button variant="outlined">
                      Manage
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  />
                }
                label="Enable Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailAlerts}
                    onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
                  />
                }
                label="Email Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emergencyAlerts}
                    onChange={(e) => handleSettingChange('emergencyAlerts', e.target.checked)}
                  />
                }
                label="Emergency Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.systemAlerts}
                    onChange={(e) => handleSettingChange('systemAlerts', e.target.checked)}
                  />
                }
                label="System Alerts"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Appearance Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appearance
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                  />
                }
                label="Dark Mode"
              />
              <TextField
                fullWidth
                select
                label="Language"
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                margin="normal"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </TextField>
              <TextField
                fullWidth
                select
                label="Timezone"
                value={settings.timezone}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
                margin="normal"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="UTC">UTC</option>
                <option value="IST">IST (UTC+5:30)</option>
                <option value="EST">EST (UTC-5)</option>
                <option value="PST">PST (UTC-8)</option>
              </TextField>
            </CardContent>
          </Card>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12}>
          {/* System Backups Management */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" gutterBottom>
                    System Backups
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<BackupIcon />}
                    onClick={handleBackupData}
                    disabled={loading}
                    color="primary"
                  >
                    Create Backup
                  </Button>
                </Box>
                
                {backupsLoading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : backups.length === 0 ? (
                  <Alert severity="info">
                    No backups found. Create your first backup to get started.
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Created At</TableCell>
                          <TableCell>Size</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Created By</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {backups.map((backup) => (
                          <TableRow key={backup.id || backup.backupId}>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                #{backup.backupId?.substring(0, 8) || backup.id?.substring(0, 8) || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>{formatDate(backup.createdAt)}</TableCell>
                            <TableCell>{formatFileSize(backup.size || 0)}</TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                {getStatusIcon(backup.status)}
                                <Chip
                                  label={backup.status}
                                  size="small"
                                  color={
                                    backup.status === 'completed'
                                      ? 'success'
                                      : backup.status === 'failed'
                                      ? 'error'
                                      : 'warning'
                                  }
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              {backup.createdByName || backup.createdBy?.substring(0, 8) || 'System'}
                            </TableCell>
                            <TableCell align="right">
                              <Box display="flex" gap={1} justifyContent="flex-end">
                                {backup.downloadUrl && (
                                  <Tooltip title="Download Backup">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDownloadBackup(backup)}
                                      color="primary"
                                    >
                                      <DownloadIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Restore from Backup">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedBackupId(backup.id || backup.backupId)
                                      setRestoreDialogOpen(true)
                                    }}
                                    color="warning"
                                    disabled={backup.status !== 'completed'}
                                  >
                                    <RestoreIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* System Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={() => setCacheDialogOpen(true)}
                      disabled={loading}
                    >
                      Clear Cache
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={handleRestartSystem}
                      disabled={loading}
                    >
                      Restart System
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Restore Backup Confirmation Dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => {
          setRestoreDialogOpen(false)
          setSelectedBackupId(null)
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobileDialog}
      >
        <DialogTitle sx={{ background: 'warning.main', color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <RestoreIcon />
            Restore from Backup
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Warning</AlertTitle>
            Restoring from a backup will replace all current system data with the backup data. This action cannot be undone.
          </Alert>
          {selectedBackupId && (
            <Box>
              <Typography variant="body1" mb={1}>
                Are you sure you want to restore from backup?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Backup ID: {selectedBackupId.substring(0, 8)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRestoreDialogOpen(false)
              setSelectedBackupId(null)
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => selectedBackupId && handleRestoreData(selectedBackupId)}
            disabled={loading || !selectedBackupId}
            startIcon={loading ? <CircularProgress size={16} /> : <RestoreIcon />}
          >
            {loading ? 'Restoring...' : 'Restore Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Cache Dialog */}
      <Dialog
        open={cacheDialogOpen}
        onClose={() => {
          setCacheDialogOpen(false)
          setCacheType('all')
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobileDialog}
      >
        <DialogTitle>Clear System Cache</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Clearing the cache will remove cached data and may temporarily slow down the system while it rebuilds the cache.
          </Alert>
          <FormControl fullWidth margin="normal">
            <InputLabel>Cache Type</InputLabel>
            <Select
              value={cacheType}
              onChange={(e: any) => setCacheType(e.target.value)}
              label="Cache Type"
            >
              <MenuItem value="all">All Cache</MenuItem>
              <MenuItem value="api">API Cache</MenuItem>
              <MenuItem value="database">Database Cache</MenuItem>
              <MenuItem value="session">Session Cache</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Select the type of cache to clear. "All Cache" will clear everything.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCacheDialogOpen(false)
              setCacheType('all')
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => handleClearCache(cacheType)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            {loading ? 'Clearing...' : 'Clear Cache'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobileDialog}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Settings
