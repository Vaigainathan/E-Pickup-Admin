import React from 'react'
import { Box, Typography, Button, Paper, Container } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { ACCESS_DENIED_MESSAGE } from '../config/roleAccess'

const AccessDenied: React.FC = () => (
  <Container maxWidth="sm">
    <Box py={6}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight={600}>
          Access denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {ACCESS_DENIED_MESSAGE}
        </Typography>
        <Button component={RouterLink} to="/dashboard" variant="contained">
          Back to dashboard
        </Button>
      </Paper>
    </Box>
  </Container>
)

export default AccessDenied
