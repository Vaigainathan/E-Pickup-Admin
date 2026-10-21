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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { generateCSRFToken, storeCSRFToken } from '../utils/csrf.ts'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../hooks/redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store'
import { loginAdmin, clearError, resetPassword } from '../store/slices/authSlice'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading, error } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
    const token = generateCSRFToken()
    setCsrfToken(token)
    storeCSRFToken(token)
  }, [isAuthenticated, navigate])

  const validateForm = () => {
    const errors: string[] = []
    if (!email.trim()) errors.push('Email is required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address')
    if (!password.trim()) errors.push('Password is required')
    else if (password.length < 6) errors.push('Password must be at least 6 characters long')
    return errors
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = Date.now()
    const timeSinceLastAttempt = now - lastAttemptTime
    if (attemptCount >= 5 && timeSinceLastAttempt < 15 * 60 * 1000) return
    if (timeSinceLastAttempt > 15 * 60 * 1000) setAttemptCount(0)
    if (validateForm().length > 0) {
      dispatch(clearError())
      return
    }
    setIsLoading(true)
    dispatch(clearError())
    setAttemptCount((prev) => prev + 1)
    setLastAttemptTime(now)
    try {
      await dispatch(loginAdmin({ email: email.trim(), password })).unwrap()
      setPassword('')
      navigate('/dashboard')
    } catch {
      setPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setForgotMessage(null)
    const trimmed = forgotEmail.trim()
    if (!trimmed) return
    try {
      const result = await dispatch(resetPassword(trimmed)).unwrap()
      setForgotMessage(
        result.message ||
          'If an account exists for this email, we sent password reset instructions.'
      )
    } catch {
      setForgotMessage(
        'If an account exists for this email, we sent password reset instructions.'
      )
    }
  }

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
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
      sx={{ backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
              EPickup Admin
            </Typography>
            <Typography variant="h6" color="text.secondary">Sign in to your account</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          )}

          <form onSubmit={handleLogin} role="form" aria-label="Admin login form">
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
            />
            <Box textAlign="right" sx={{ mt: 1 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => {
                  setForgotEmail(email)
                  setForgotOpen(true)
                }}
              >
                Forgot password?
              </Link>
            </Box>
            <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading || !email || !password} sx={{ mt: 3, mb: 2 }}>
              {isLoading ? <CircularProgress size={24} aria-hidden="true" /> : 'Sign In'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">Admin Access Only</Typography>
          </Divider>
        </Paper>
      </Container>

      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset password</DialogTitle>
        <DialogContent>
          {forgotMessage ? (
            <Alert severity="success" sx={{ mt: 1 }}>{forgotMessage}</Alert>
          ) : (
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              margin="normal"
              autoFocus
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotOpen(false)}>Close</Button>
          {!forgotMessage && (
            <Button onClick={handleForgotPassword} variant="contained">Send reset link</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Login
