import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './store/index'
import Layout from './layouts/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ErrorBoundary from './components/ErrorBoundary'
import { Box, CircularProgress } from '@mui/material'

// Lazy load all pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DriverManagement = lazy(() => import('./pages/DriverManagement'))
const DriverDataManagement = lazy(() => import('./pages/DriverDataManagement'))
const CustomerManagement = lazy(() => import('./pages/CustomerManagement'))
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'))
const BookingManagement = lazy(() => import('./pages/BookingManagementModern'))
const EmergencyServices = lazy(() => import('./pages/EmergencyServices'))
const SystemMonitoring = lazy(() => import('./pages/SystemMonitoring'))
const SupportTickets = lazy(() => import('./pages/SupportTickets'))
const LiveTracking = lazy(() => import('./pages/LiveTracking'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))
const AdminManagement = lazy(() => import('./pages/AdminManagement'))

// Loading component
const PageLoader = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="200px"
  >
    <CircularProgress />
  </Box>
)

function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const token = useSelector((state: RootState) => state.auth.token)

  // Debug logging
  console.log('App render - isAuthenticated:', isAuthenticated, 'token:', token)

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="/drivers" element={<ErrorBoundary><DriverManagement /></ErrorBoundary>} />
            <Route path="/driver-data" element={<ErrorBoundary><DriverDataManagement /></ErrorBoundary>} />
            <Route path="/customers" element={<ErrorBoundary><CustomerManagement /></ErrorBoundary>} />
            <Route path="/customers/:id" element={<ErrorBoundary><CustomerDetail /></ErrorBoundary>} />
            <Route path="/bookings" element={<ErrorBoundary><BookingManagement /></ErrorBoundary>} />
            <Route path="/emergency" element={<ErrorBoundary><EmergencyServices /></ErrorBoundary>} />
            <Route path="/support" element={<ErrorBoundary><SupportTickets /></ErrorBoundary>} />
            <Route path="/live-tracking" element={<ErrorBoundary><LiveTracking /></ErrorBoundary>} />
            <Route path="/monitoring" element={<ErrorBoundary><SystemMonitoring /></ErrorBoundary>} />
            <Route path="/analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
            <Route path="/admin-management" element={<ErrorBoundary><AdminManagement /></ErrorBoundary>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  )
}

export default App
