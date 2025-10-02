import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import {
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
} from '@mui/icons-material'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../hooks/redux'
import { RootState } from '../store'
import { fetchAnalytics, setTimeRange } from '../store/slices/analyticsSlice'

const Analytics: React.FC = () => {
  const dispatch = useAppDispatch()
  const { data: analyticsData, loading, timeRange } = useSelector((state: RootState) => state.analytics)
  
  // const [selectedMetric, setSelectedMetric] = useState('bookings')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchAnalytics({
      start: timeRange.start,
      end: timeRange.end,
      metrics: ['drivers', 'bookings', 'revenue']
    }))
  }, [dispatch, timeRange])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await dispatch(fetchAnalytics({
        start: timeRange.start,
        end: timeRange.end,
        metrics: ['drivers', 'bookings', 'revenue']
      }))
      setError(null)
    } catch (err: any) {
      console.error('Analytics refresh error:', err)
      setError(err.message || 'Failed to refresh analytics data')
    } finally {
      setRefreshing(false)
    }
  }

  const handleExport = () => {
    // Export analytics data functionality
    console.log('Exporting analytics data...')
  }

  const handleTimeRangeChange = (range: string) => {
    const now = new Date()
    let start: Date

    switch (range) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    dispatch(setTimeRange({
      start: start.toISOString(),
      end: now.toISOString()
    }))
  }

  // const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const pieData = analyticsData?.users ? [
    { name: 'Drivers', value: analyticsData.users.drivers || 0, color: '#00C49F' },
    { name: 'Customers', value: analyticsData.users.customers || 0, color: '#FFBB28' },
    { name: 'Others', value: (analyticsData.users.total || 0) - (analyticsData.users.drivers || 0) - (analyticsData.users.customers || 0), color: '#FF8042' },
  ] : []

  const revenueData = analyticsData?.trends?.revenue || []
  const bookingData = analyticsData?.trends?.bookings || []

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AssessmentIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Analytics & Reports
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Real-time insights and performance metrics
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export data">
            <IconButton onClick={handleExport}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value="30d"
              label="Time Range"
              onChange={(e) => handleTimeRangeChange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ position: 'relative', overflow: 'visible' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PeopleIcon />
                </Avatar>
                <Chip
                  label="+12%"
                  color="success"
                  size="small"
                  icon={<TrendingUpIcon />}
                />
              </Box>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Total Drivers
              </Typography>
              <Typography variant="h4" component="h2" fontWeight="bold">
                {analyticsData?.users.drivers || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {analyticsData?.users.total || 0} total users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Total Bookings
              </Typography>
              <Typography variant="h4" component="h2" fontWeight="bold">
                {analyticsData?.bookings.total || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {analyticsData?.bookings.completed || 0} completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Total Revenue
              </Typography>
              <Typography variant="h4" component="h2" fontWeight="bold">
                ₹{analyticsData?.revenue?.total?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ₹{analyticsData?.revenue?.averagePerBooking || 0} avg fare
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="h6">
                System Uptime
              </Typography>
              <Typography variant="h4" component="h2" fontWeight="bold">
                99.9%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                System uptime
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Driver Status Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Driver Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Booking Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Booking Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bookingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Bookings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Booking Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Booking Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Completed', value: analyticsData?.bookings.completed || 0 },
                  { name: 'Active', value: analyticsData?.bookings.active || 0 },
                  { name: 'Total', value: analyticsData?.bookings.total || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      99.9%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      System Uptime
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      150ms
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Average Response Time
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      0.1%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Error Rate
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Analytics
