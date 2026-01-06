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
  useMediaQuery,
  useTheme,
  CircularProgress,
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
import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../hooks/redux'
import { RootState } from '../store'
import { fetchAnalytics, setTimeRange, clearError } from '../store/slices/analyticsSlice'
import { comprehensiveAdminService } from '../services/comprehensiveAdminService'
import { analyticsService } from '../services/analyticsService'

const Analytics: React.FC = () => {
  const dispatch = useAppDispatch()
  const { data: analyticsData, loading, timeRange, error: reduxError } = useSelector((state: RootState) => state.analytics)
  
  // Responsive hooks
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  
  // Calculate responsive chart height
  const chartHeight = isMobile ? 250 : isTablet ? 300 : 400
  const pieChartHeight = isMobile ? 200 : 300
  
  // const [selectedMetric, setSelectedMetric] = useState('bookings')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // ✅ NEW: Cancellation analytics state
  const [cancellationAnalytics, setCancellationAnalytics] = useState<any>(null)
  const [cancellationLoading, setCancellationLoading] = useState(false)
  // Revenue analytics state
  const [revenueTrends, setRevenueTrends] = useState<any[]>([])
  const [realMoneyRevenue, setRealMoneyRevenue] = useState<any>(null)
  const [revenueLoading, setRevenueLoading] = useState(false)
  // Booking analytics state
  const [bookingAnalytics, setBookingAnalytics] = useState<any>(null)
  const [bookingAnalyticsLoading, setBookingAnalyticsLoading] = useState(false)
  // Driver analytics state
  const [driverAnalytics, setDriverAnalytics] = useState<any>(null)
  // Support analytics state
  const [supportAnalytics, setSupportAnalytics] = useState<any>(null)

  // ✅ NEW: Fetch cancellation analytics
  const fetchCancellationAnalytics = useCallback(async () => {
    try {
      setCancellationLoading(true)
      const response = await comprehensiveAdminService.getCancellationAnalytics({
        startDate: timeRange.start,
        endDate: timeRange.end
      })
      if (response.success && response.data) {
        setCancellationAnalytics(response.data)
      }
    } catch (err) {
      console.error('Error fetching cancellation analytics:', err)
    } finally {
      setCancellationLoading(false)
    }
  }, [timeRange])

  // Fetch revenue trends and real-money revenue
  const fetchRevenueAnalytics = useCallback(async () => {
    try {
      setRevenueLoading(true)
      const [trendsResponse, realMoneyResponse] = await Promise.all([
        comprehensiveAdminService.getRevenueTrends(timeRange.start, timeRange.end),
        comprehensiveAdminService.getRealMoneyRevenue(timeRange.start, timeRange.end)
      ])
      
      if (trendsResponse.success && trendsResponse.data) {
        setRevenueTrends(Array.isArray(trendsResponse.data) ? trendsResponse.data : [])
      }
      
      if (realMoneyResponse.success && realMoneyResponse.data) {
        setRealMoneyRevenue(realMoneyResponse.data)
      }
    } catch (err) {
      console.error('Error fetching revenue analytics:', err)
    } finally {
      setRevenueLoading(false)
    }
  }, [timeRange])

  // Fetch booking analytics
  const fetchBookingAnalytics = useCallback(async () => {
    try {
      setBookingAnalyticsLoading(true)
      const data = await analyticsService.getBookingAnalytics(timeRange.start, timeRange.end)
      setBookingAnalytics(data)
    } catch (err) {
      console.error('Error fetching booking analytics:', err)
      setBookingAnalytics(null)
    } finally {
      setBookingAnalyticsLoading(false)
    }
  }, [timeRange])

  // Fetch driver analytics
  const fetchDriverAnalytics = useCallback(async () => {
    try {
      const data = await analyticsService.getDriverAnalytics(timeRange.start, timeRange.end)
      setDriverAnalytics(data)
    } catch (err) {
      console.error('Error fetching driver analytics:', err)
      setDriverAnalytics(null)
    }
  }, [timeRange])

  // Fetch support analytics
  const fetchSupportAnalytics = useCallback(async () => {
    try {
      const data = await analyticsService.getSupportAnalytics(timeRange.start, timeRange.end)
      setSupportAnalytics(data)
    } catch (err) {
      console.error('Error fetching support analytics:', err)
      setSupportAnalytics(null)
    }
  }, [timeRange])

  useEffect(() => {
    // ✅ FIX: Fetch analytics data - errors will be handled by Redux state
    dispatch(fetchAnalytics({
      start: timeRange.start,
      end: timeRange.end,
      metrics: ['drivers', 'bookings', 'revenue']
    }))
    // ✅ NEW: Fetch cancellation analytics
    fetchCancellationAnalytics()
    // Fetch revenue analytics
    fetchRevenueAnalytics()
    // Fetch booking analytics
    fetchBookingAnalytics()
    // Fetch driver analytics
    fetchDriverAnalytics()
    // Fetch support analytics
    fetchSupportAnalytics()
  }, [dispatch, timeRange, fetchCancellationAnalytics, fetchRevenueAnalytics, fetchBookingAnalytics, fetchDriverAnalytics, fetchSupportAnalytics])

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

  // ✅ FIX: Safe data extraction with proper null checks
  const pieData = analyticsData?.users ? [
    { name: 'Drivers', value: analyticsData.users.drivers || 0, color: '#00C49F' },
    { name: 'Customers', value: analyticsData.users.customers || 0, color: '#FFBB28' },
    { name: 'Others', value: Math.max(0, (analyticsData.users.total || 0) - (analyticsData.users.drivers || 0) - (analyticsData.users.customers || 0)), color: '#FF8042' },
  ] : []

  const revenueData = analyticsData?.trends?.revenue || []
  const bookingData = analyticsData?.trends?.bookings || []

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems={isMobile ? "flex-start" : "center"} mb={3} flexWrap="wrap" gap={2}>
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

      {/* ✅ FIX: Show both local and Redux errors */}
      {(error || reduxError) && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => { setError(null); dispatch(clearError()) }}>
          {error || reduxError}
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
                {analyticsData?.users?.drivers || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {analyticsData?.users?.total || 0} total users
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
                {analyticsData?.bookings?.total || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {analyticsData?.bookings?.completed || 0} completed
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
                ₹{(analyticsData?.revenue?.total || 0).toLocaleString()}
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
              {revenueLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={chartHeight}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <AreaChart data={revenueTrends.length > 0 ? revenueTrends : revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                    />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <RechartsTooltip 
                      formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                      contentStyle={{ fontSize: isMobile ? '12px' : '14px', padding: isMobile ? '4px 8px' : '8px 12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Real Money vs Wallet Revenue */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Breakdown
              </Typography>
              {revenueLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={pieChartHeight}>
                  <CircularProgress />
                </Box>
              ) : realMoneyRevenue ? (
                <Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Real Money Revenue
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      ₹{(realMoneyRevenue.realMoney || realMoneyRevenue.total || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Wallet/Virtual Revenue
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="secondary">
                      ₹{(realMoneyRevenue.wallet || realMoneyRevenue.virtual || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  {realMoneyRevenue.percentage && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Real Money: {realMoneyRevenue.percentage.realMoney || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Wallet: {realMoneyRevenue.percentage.wallet || 0}%
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={pieChartHeight}>
                  <Typography variant="body2" color="text.secondary">
                    No revenue data available
                  </Typography>
                </Box>
              )}
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
              <ResponsiveContainer width="100%" height={pieChartHeight}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={isMobile ? false : ({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
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
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={bookingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <RechartsTooltip contentStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
                  <Legend 
                    wrapperStyle={{ fontSize: isMobile ? '11px' : '13px', paddingTop: isMobile ? '10px' : '5px' }}
                    iconSize={isMobile ? 8 : 14}
                  />
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
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={[
                  { name: 'Completed', value: analyticsData?.bookings?.completed || 0 },
                  { name: 'Active', value: analyticsData?.bookings?.active || 0 },
                  { name: 'Total', value: analyticsData?.bookings?.total || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <RechartsTooltip contentStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ✅ NEW: Cancellation Analytics Charts */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600, color: '#dc3545' }}>
            Cancellation Analytics
          </Typography>
        </Grid>

        {/* Cancellations Over Time */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cancellations Over Time
              </Typography>
              {cancellationLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={chartHeight}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <LineChart data={cancellationAnalytics?.dailyDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                    />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <RechartsTooltip contentStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
                    <Legend 
                      wrapperStyle={{ fontSize: isMobile ? '11px' : '13px', paddingTop: isMobile ? '10px' : '5px' }}
                      iconSize={isMobile ? 8 : 14}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#dc3545"
                      strokeWidth={2}
                      name="Cancellations"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cancellation Reasons */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cancellation Reasons
              </Typography>
              {cancellationLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={pieChartHeight}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={pieChartHeight}>
                  <PieChart>
                    <Pie
                      data={cancellationAnalytics?.byReason || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={isMobile ? false : ({ label, percent }) => `${label} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={isMobile ? 60 : 80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(cancellationAnalytics?.byReason || []).map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#dc3545', '#ff6b6b', '#ffa500', '#ffd700', '#90ee90', '#87ceeb', '#dda0dd'][index % 7]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Driver Cancellation Rates */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Driver Cancellation Rates
              </Typography>
              {cancellationLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={chartHeight}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart 
                    data={(cancellationAnalytics?.byDriver || []).slice(0, 10)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="driverName"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 80 : 120}
                    />
                    <RechartsTooltip contentStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
                    <Bar dataKey="cancellationCount" fill="#dc3545" name="Cancellations" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Hourly Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cancellations by Hour
              </Typography>
              {cancellationLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={chartHeight}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={cancellationAnalytics?.hourlyDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <RechartsTooltip contentStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
                    <Bar dataKey="count" fill="#dc3545" name="Cancellations" />
                  </BarChart>
                </ResponsiveContainer>
              )}
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

        {/* Booking Analytics Section */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            Booking Analytics
          </Typography>
        </Grid>

        {/* Completion Rates */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Completion Rates
              </Typography>
              {bookingAnalyticsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={chartHeight}>
                  <CircularProgress />
                </Box>
              ) : bookingAnalytics?.completionRate ? (
                <Box>
                  <Typography variant="h3" fontWeight="bold" color="success.main">
                    {(bookingAnalytics.completionRate * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {bookingAnalytics.completedBookings || 0} completed out of {bookingAnalytics.totalBookings || 0} total
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No booking analytics data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Peak Booking Times */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Peak Booking Times
              </Typography>
              {bookingAnalyticsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={chartHeight}>
                  <CircularProgress />
                </Box>
              ) : bookingAnalytics?.peakHours ? (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={bookingAnalytics.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                    />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <RechartsTooltip contentStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
                    <Bar dataKey="count" fill="#8884d8" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No peak time data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Booking Distribution by Area */}
        {bookingAnalytics?.byArea && bookingAnalytics.byArea.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bookings by Area
                </Typography>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={bookingAnalytics.byArea.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="area"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 80 : 120}
                    />
                    <RechartsTooltip contentStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
                    <Bar dataKey="count" fill="#00C49F" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Driver Analytics Section */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            Driver Analytics
          </Typography>
        </Grid>

        {driverAnalytics && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Drivers
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {driverAnalytics.totalDrivers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Active Drivers
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {driverAnalytics.activeDrivers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Verified Drivers
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {driverAnalytics.verifiedDrivers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Rating
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {driverAnalytics.averageRating ? driverAnalytics.averageRating.toFixed(2) : '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Support Analytics Section */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            Support Analytics
          </Typography>
        </Grid>

        {supportAnalytics && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Tickets
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {supportAnalytics.totalTickets || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resolution Time
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {supportAnalytics.averageResolutionTime ? `${supportAnalytics.averageResolutionTime}h` : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resolved Tickets
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {supportAnalytics.resolvedTickets || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Open Tickets
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {supportAnalytics.openTickets || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  )
}

export default Analytics
