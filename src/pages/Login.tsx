import React, { useState, useEffect } from 'react'
import {
  Box,
  
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Divider,
  Link,
} from '@mui/material'
import { generateCSRFToken, storeCSRFToken } from '../utils/csrf.ts'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../hooks/redux'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { RootState } from '../store'
import { loginAdmin, clearError } from '../store/slices/authSlice'
import { errorHandlerService } from '../services/errorHandlerService'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading, error } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
    
    // Generate CSRF token on component mount
    const token = generateCSRFToken()
    setCsrfToken(token)
    storeCSRFToken(token)
  }, [isAuthenticated, navigate])

  const validateForm = () => {
    const errors: string[] = []
    
    if (!email.trim()) {
      errors.push('Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address')
    }
    
    if (!password.trim()) {
      errors.push('Password is required')
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters long')
    }
    
    return errors
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Rate limiting check
    const now = Date.now()
    const timeSinceLastAttempt = now - lastAttemptTime
    
    if (attemptCount >= 5 && timeSinceLastAttempt < 15 * 60 * 1000) { // 15 minutes
      console.error('Too many login attempts. Please try again later.')
      return
    }
    
    // Reset attempt count if enough time has passed
    if (timeSinceLastAttempt > 15 * 60 * 1000) {
      setAttemptCount(0)
    }
    
    // Client-side validation
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      dispatch(clearError())
      // You could set these errors in state and display them
      console.error('Validation errors:', validationErrors)
      return
    }
    
    setIsLoading(true)
    dispatch(clearError())
    
    // Update attempt tracking
    setAttemptCount(prev => prev + 1)
    setLastAttemptTime(now)

    try {
      await dispatch(loginAdmin({ email: email.trim(), password })).unwrap()
      // Clear password from state after successful login
      setPassword('')
      navigate('/dashboard')
    } catch (error: any) {
      // Sanitize error logging to prevent sensitive information exposure
      const sanitizedError = {
        message: error.message || 'Login failed',
        code: error.code || 'LOGIN_ERROR',
        timestamp: new Date().toISOString()
      }
      
      console.error('Login error:', sanitizedError)
      const errorInfo = errorHandlerService.handleError(error)
      console.error('Formatted error:', errorInfo)
      // Clear password on error as well
      setPassword('')
    } finally {
      setIsLoading(false)
    }
  }



  if (authLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
      sx={{
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
              EPickup Admin
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin} role="form" aria-label="Admin login form">
            {/* CSRF Token */}
            <input type="hidden" name="csrf_token" value={csrfToken} />
            
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
              aria-describedby="email-helper-text"
              aria-invalid={error ? 'true' : 'false'}
              inputProps={{
                'aria-label': 'Email address for admin login',
                'aria-required': 'true'
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              aria-describedby="password-helper-text"
              aria-invalid={error ? 'true' : 'false'}
              inputProps={{
                'aria-label': 'Password for admin login',
                'aria-required': 'true'
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading || !email || !password}
              sx={{ mt: 3, mb: 2 }}
              aria-describedby="login-button-description"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} aria-hidden="true" />
                  <span id="login-button-description" className="sr-only">Signing in, please wait...</span>
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Admin Access Only
            </Typography>
          </Divider>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              For demo purposes, use:
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="bold">
              admin2@epickup.com / EpickupAdmin2024!
            </Typography>
          </Box>

          <Box textAlign="center" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Don't have an admin account?{' '}
              <Link component={RouterLink} to="/signup" variant="body2">
                Create one here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default Login
