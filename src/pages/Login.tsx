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
  InputAdornment,
  IconButton,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material'
import { generateCSRFToken, storeCSRFToken } from '../utils/csrf.ts'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../hooks/redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store'
import { loginAdmin, clearError, resetPassword } from '../store/slices/authSlice'
import { AdminColors } from '../constants/Colors'

const isStagingEnv = import.meta.env.MODE === 'staging'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)

  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
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

  const fieldFocusSx = {
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: AdminColors.primary,
      borderWidth: 2,
    },
  }

  const stagingBadge = isStagingEnv ? (
    <Chip
      label="ePickup Admin — staging"
      size="small"
      color="warning"
      sx={{
        mt: 2,
        fontWeight: 600,
        color: 'warning.contrastText',
      }}
      aria-label="Staging environment"
    />
  ) : null

  const loginForm = (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        border: `1px solid ${AdminColors.border.light}`,
        width: '100%',
        maxWidth: 420,
      }}
    >
      {!isDesktop && (
        <Box textAlign="center" mb={3}>
          <Box
            component="img"
            src="/epickup-logo.png"
            alt="ePickup"
            sx={{ width: 140, maxWidth: '80%', height: 'auto', objectFit: 'contain' }}
          />
          {stagingBadge}
        </Box>
      )}

      <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
        Sign in
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Use your admin credentials
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
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
          sx={fieldFocusSx}
        />
        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
          autoComplete="current-password"
          sx={fieldFocusSx}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
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
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading || !email || !password}
          sx={{ mt: 3, mb: 2 }}
        >
          {isLoading ? <CircularProgress size={24} aria-hidden="true" /> : 'Sign In'}
        </Button>
      </form>

      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Admin Access Only
        </Typography>
      </Divider>
    </Paper>
  )

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
      flexDirection={{ xs: 'column', md: 'row' }}
      bgcolor="background.default"
    >
      {isDesktop && (
        <Box
          sx={{
            width: { md: '42%' },
            minWidth: 320,
            backgroundColor: AdminColors.primary,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 6,
            py: 8,
          }}
        >
          <Box textAlign="center" maxWidth={360}>
            <Box
              component="img"
              src="/epickup-logo.png"
              alt="ePickup"
              sx={{ width: 180, maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
            />
            <Typography variant="body1" sx={{ mt: 3, color: 'rgba(255,255,255,0.75)' }}>
              Admin portal
            </Typography>
            {stagingBadge}
          </Box>
        </Box>
      )}

      <Box
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ p: { xs: 3, md: 6 }, bgcolor: 'background.default' }}
      >
        {isDesktop ? loginForm : <Container maxWidth="sm">{loginForm}</Container>}
      </Box>

      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset password</DialogTitle>
        <DialogContent>
          {forgotMessage ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              {forgotMessage}
            </Alert>
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
            <Button onClick={handleForgotPassword} variant="contained">
              Send reset link
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Login
