import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link
} from '@mui/material'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../hooks/redux'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { RootState } from '../store'
import { signupAdmin, clearError } from '../store/slices/authSlice'
import { errorHandlerService } from '../services/errorHandlerService'

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'super_admin' as 'super_admin'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, error, loading: authLoading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleRoleChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      role: e.target.value
    }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    dispatch(clearError())

    try {
      await dispatch(signupAdmin({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        role: formData.role
      })).unwrap()
      
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Signup error:', error)
      const errorInfo = errorHandlerService.handleError(error)
      console.error('Formatted error:', errorInfo)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Admin Signup
          </Typography>
          
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Create a new admin account for EPickup
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSignup} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
              helperText={errors.email}
              aria-describedby="email-helper-text"
              aria-invalid={!!errors.email}
              inputProps={{
                'aria-label': 'Email address for admin signup',
                'aria-required': 'true'
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="displayName"
              label="Display Name"
              id="displayName"
              autoComplete="name"
              value={formData.displayName}
              onChange={handleInputChange}
              error={!!errors.displayName}
              helperText={errors.displayName}
              aria-describedby="display-name-helper-text"
              aria-invalid={!!errors.displayName}
              inputProps={{
                'aria-label': 'Display name for admin account',
                'aria-required': 'true'
              }}
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel id="role-label">Admin Role</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Admin Role"
                onChange={handleRoleChange}
                aria-describedby="role-helper-text"
                inputProps={{
                  'aria-label': 'Select admin role',
                  'aria-required': 'true'
                }}
              >
                <MenuItem value="super_admin">Super Admin (Full Access)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
              helperText={errors.password || 'Minimum 8 characters'}
              aria-describedby="password-helper-text"
              aria-invalid={!!errors.password}
              inputProps={{
                'aria-label': 'Password for admin account',
                'aria-required': 'true'
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              aria-describedby="confirm-password-helper-text"
              aria-invalid={!!errors.confirmPassword}
              inputProps={{
                'aria-label': 'Confirm password for admin account',
                'aria-required': 'true'
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
              aria-describedby="signup-button-description"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} aria-hidden="true" />
                  <span id="signup-button-description" className="sr-only">Creating account, please wait...</span>
                </>
              ) : (
                'Create Admin Account'
              )}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2">
                Already have an admin account?{' '}
                <Link component={RouterLink} to="/login" variant="body2">
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Signup
