import { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Typography, Button, Paper, Alert } from '@mui/material'
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console and external service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    })

    // Log to external service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2
              }}
            />
            
            <Typography variant="h4" gutterBottom color="error">
              Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Details:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Component Stack:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </>
                )}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                color="primary"
              >
                Try Again
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                color="secondary"
              >
                Refresh Page
              </Button>
            </Box>
          </Paper>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary