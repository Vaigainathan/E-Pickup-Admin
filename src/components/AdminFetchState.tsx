import React from 'react'
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'

interface AdminFetchStateProps {
  loading: boolean
  error: string | null
  onRetry?: () => void
  empty?: boolean
  emptyMessage?: string
  children: React.ReactNode
}

const AdminFetchState: React.FC<AdminFetchStateProps> = ({
  loading,
  error,
  onRetry,
  empty,
  emptyMessage = 'Nothing to show yet.',
  children,
}) => {
  if (loading && empty) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
      >
        {error}
      </Alert>
    )
  }

  if (empty) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    )
  }

  return <>{children}</>
}

export default AdminFetchState
