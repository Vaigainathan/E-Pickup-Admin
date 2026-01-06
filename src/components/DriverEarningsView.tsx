import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { comprehensiveAdminService } from '../services/comprehensiveAdminService'
import { AdminColors } from '../constants/Colors'

interface DriverEarningsViewProps {
  driverId: string
  driverName?: string
}

interface EarningsData {
  totalEarnings: number
  totalCommission: number
  netEarnings: number
  tripCount: number
  averageEarningsPerTrip: number
  earningsByPeriod: Array<{
    period: string
    earnings: number
    commission: number
    trips: number
  }>
}

const DriverEarningsView: React.FC<DriverEarningsViewProps> = ({ driverId, driverName }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null)
  const [period, setPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all')
  const [dateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const loadEarningsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await comprehensiveAdminService.getDriverEarnings?.(driverId, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        period
      }) || await fetch(`/api/admin/drivers/${driverId}/earnings?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&period=${period}`).then(r => r.json())
      
      if (response.success && response.data) {
        setEarningsData(response.data)
      } else {
        setError(response.error?.message || 'Failed to load earnings data')
      }
    } catch (err) {
      console.error('Error loading earnings data:', err)
      setError('Failed to load earnings data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEarningsData()
  }, [driverId, period, dateRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleExport = () => {
    if (!earningsData) return
    
    const csvContent = [
      ['Period', 'Earnings', 'Commission', 'Net Earnings', 'Trips'],
      ...earningsData.earningsByPeriod.map(p => [
        p.period,
        p.earnings.toString(),
        p.commission.toString(),
        (p.earnings - p.commission).toString(),
        p.trips.toString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `driver-earnings-${driverId}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={loadEarningsData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    )
  }

  if (!earningsData) {
    return <Alert severity="info">No earnings data available</Alert>
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Earnings Details {driverName && `- ${driverName}`}
        </Typography>
        <Box display="flex" gap={1}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={!earningsData}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={loadEarningsData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Earnings Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Total Earnings
              </Typography>
              <Typography variant="h5" fontWeight="bold" color={AdminColors.primary}>
                {formatCurrency(earningsData.totalEarnings)}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                {earningsData.tripCount} trips
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Total Commission
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#F44336">
                {formatCurrency(earningsData.totalCommission)}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Deducted from wallet
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Net Earnings
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#4CAF50">
                {formatCurrency(earningsData.netEarnings)}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                After commission
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Average per Trip
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#FF9800">
                {formatCurrency(earningsData.averageEarningsPerTrip)}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Per completed trip
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Earnings by Period Table */}
      {earningsData.earningsByPeriod.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Earnings by Period
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Earnings</TableCell>
                    <TableCell align="right">Commission</TableCell>
                    <TableCell align="right">Net Earnings</TableCell>
                    <TableCell align="right">Trips</TableCell>
                    <TableCell align="right">Avg per Trip</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earningsData.earningsByPeriod.map((periodData) => (
                    <TableRow key={periodData.period}>
                      <TableCell>{periodData.period}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(periodData.earnings)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#F44336' }}>
                        {formatCurrency(periodData.commission)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                        {formatCurrency(periodData.earnings - periodData.commission)}
                      </TableCell>
                      <TableCell align="right">{periodData.trips}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(periodData.trips > 0 ? periodData.earnings / periodData.trips : 0)}
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

export default DriverEarningsView

