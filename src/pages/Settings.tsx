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
  // IconButton, // Removed unused import
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
  restartSystem 
} from '../store/slices/settingsSlice'

const Settings: React.FC = () => {
  const dispatch = useAppDispatch()
  const { user } = useSelector((state: RootState) => state.auth)
  const { settings, loading } = useSelector((state: RootState) => state.settings) // Removed unused error
  
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
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Fetch settings when component mounts
    dispatch(fetchSettings())
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
    } catch (error) {
      setErrorMessage('Failed to create backup')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleRestoreData = async () => {
    try {
      // For now, use a placeholder backup ID
      await dispatch(restoreData('latest')).unwrap()
      setSuccessMessage('System restored successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrorMessage('Failed to restore data')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleClearCache = async () => {
    try {
      await dispatch(clearCache()).unwrap()
      setSuccessMessage('System cache cleared successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<BackupIcon />}
                    onClick={handleBackupData}
                    disabled={loading}
                  >
                    Backup Data
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<RestoreIcon />}
                    onClick={handleRestoreData}
                    disabled={loading}
                  >
                    Restore Data
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleClearCache}
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

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
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
