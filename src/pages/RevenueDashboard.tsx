import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  People as PeopleIcon,
} from '@mui/icons-material'
import { comprehensiveAdminService } from '../services/comprehensiveAdminService'
import { realTimeService } from '../services/realTimeService'
import { AdminColors } from '../constants/Colors'

interface RevenueStats {
  totalRevenue: number
  transactionCount: number
  totalCommissionsDeducted?: number
  commissionTransactionCount?: number
  averageTransactionValue: number
  revenueByPaymentMethod: Array<{
    paymentMethod: string
    revenue: number
    percentage: number
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number
  }>
  thisMonthRevenue: number
  lastMonthRevenue: number
  monthOverMonthGrowth: number
}

interface RevenueByDriver {
  driverId: string
  revenue: number
  transactionCount: number
}

const RevenueDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null)
  const [revenueByDriver, setRevenueByDriver] = useState<RevenueByDriver[]>([])
  const [_period] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [_dateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const loadRevenueData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load revenue stats
      const statsResponse = await comprehensiveAdminService.getRevenueStats()
      if (statsResponse.success && statsResponse.data) {
        setRevenueStats(statsResponse.data.stats)
      }

      // Load revenue by driver
      const driversResponse = await comprehensiveAdminService.getRevenueByDriver()
      if (driversResponse.success && driversResponse.data) {
        setRevenueByDriver(driversResponse.data.drivers || [])
      }
    } catch (err) {
      console.error('Error loading revenue data:', err)
      setError('Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRevenueData()
    
    // Setup real-time revenue updates
    realTimeService.setEventHandlers({
      onRevenueUpdate: (data: any) => {
        console.log('💰 [REALTIME] Revenue update received:', data)
        // Refresh revenue data when update is received
        loadRevenueData()
      }
    })
    
    // Connect to real-time service if not already connected
    if (!realTimeService.getConnectionStatus()) {
      realTimeService.connect().catch(err => {
        console.warn('⚠️ Failed to connect to real-time service:', err)
      })
    }
    
    // Cleanup on unmount
    return () => {
      realTimeService.setEventHandlers({
        onRevenueUpdate: undefined
      })
    }
  }, [loadRevenueData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadRevenueData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color={AdminColors.primary}>
          Revenue Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadRevenueData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Total Revenue Card */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue (Top-ups)
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={AdminColors.primary}>
                    {revenueStats ? formatCurrency(revenueStats.totalRevenue) : '₹0'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Real money from driver wallet top-ups ({revenueStats?.transactionCount || 0} txns)
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 48, color: AdminColors.primary, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Trip Wallet Commission
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="#F44336">
                  {revenueStats?.totalCommissionsDeducted != null
                    ? formatCurrency(revenueStats.totalCommissionsDeducted)
                    : '₹0'}
                </Typography>
                <Typography variant="body2" color="textSecondary" mt={1}>
                  Points debited per trip ({revenueStats?.commissionTransactionCount || 0} deductions)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    This Month
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={AdminColors.primary}>
                    {revenueStats ? formatCurrency(revenueStats.thisMonthRevenue) : '₹0'}
                  </Typography>
                  {revenueStats && (
                    <Box display="flex" alignItems="center" mt={1}>
                      {revenueStats.monthOverMonthGrowth >= 0 ? (
                        <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 20, mr: 0.5 }} />
                      ) : (
                        <TrendingDownIcon sx={{ color: '#F44336', fontSize: 20, mr: 0.5 }} />
                      )}
                      <Typography
                        variant="body2"
                        color={revenueStats.monthOverMonthGrowth >= 0 ? '#4CAF50' : '#F44336'}
                      >
                        {Math.abs(revenueStats.monthOverMonthGrowth).toFixed(1)}% vs last month
                      </Typography>
                    </Box>
                  )}
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: AdminColors.primary, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Average Transaction
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={AdminColors.primary}>
                    {revenueStats ? formatCurrency(revenueStats.averageTransactionValue) : '₹0'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Per top-up
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, color: AdminColors.primary, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue by Payment Method */}
      {revenueStats && revenueStats.revenueByPaymentMethod.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Revenue by Payment Method
            </Typography>
            <Grid container spacing={2}>
              {revenueStats.revenueByPaymentMethod.map((method) => (
                <Grid item xs={12} sm={6} md={3} key={method.paymentMethod}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      {method.paymentMethod.toUpperCase()}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color={AdminColors.primary}>
                      {formatCurrency(method.revenue)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {method.percentage.toFixed(1)}% of total
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Revenue by Driver */}
      {revenueByDriver.length > 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Revenue by Driver
              </Typography>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  // TODO: Implement export functionality
                  console.log('Export revenue by driver')
                }}
              >
                Export
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Driver ID</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Average</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenueByDriver.slice(0, 10).map((driver) => (
                    <TableRow key={driver.driverId}>
                      <TableCell>{driver.driverId}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(driver.revenue)}
                      </TableCell>
                      <TableCell align="right">{driver.transactionCount}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(driver.revenue / driver.transactionCount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default RevenueDashboard

