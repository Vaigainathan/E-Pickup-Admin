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
  TextField,
} from '@mui/material'
import {
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { comprehensiveAdminService } from '../services/comprehensiveAdminService'
import { AdminColors } from '../constants/Colors'

interface RevenueStats {
  totalRevenue: number
  transactionCount: number
  parcelCommission?: number
  marketplaceCommission?: number
  unknownCommission?: number
  totalCommissionsDeducted?: number
  commissionTransactionCount?: number
  revenueSource?: string
  period?: { startDate: string | null; endDate: string | null } | null
}

const defaultEnd = new Date().toISOString().split('T')[0]
const defaultStart = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]

const RevenueDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null)
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)

  const loadRevenueData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const statsResponse = await comprehensiveAdminService.getRevenueStats(startDate, endDate)
      if (statsResponse.success && statsResponse.data) {
        setRevenueStats(statsResponse.data as RevenueStats)
      } else {
        setError(statsResponse.error?.message || 'Failed to load revenue data')
      }
    } catch (err) {
      console.error('Error loading revenue data:', err)
      setError('Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    loadRevenueData()
  }, [loadRevenueData])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)

  if (loading && !revenueStats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold" color={AdminColors.primary}>
          Revenue
        </Typography>
        <Button startIcon={<RefreshIcon />} onClick={loadRevenueData} disabled={loading}>
          Refresh
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              label="Start date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <TextField
              label="End date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button variant="contained" onClick={loadRevenueData}>Apply period</Button>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Money-in and commission split use the same date range (completed driver top-ups and commission debits).
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadRevenueData}>Retry</Button>}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Money in</Typography>
              </Box>
              <Typography variant="h4">{formatCurrency(revenueStats?.totalRevenue || 0)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {revenueStats?.transactionCount || 0} completed driver top-ups
                {revenueStats?.revenueSource ? ` (${revenueStats.revenueSource})` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Commission — Parcel</Typography>
              <Typography variant="h4">{formatCurrency(revenueStats?.parcelCommission || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Commission — Marketplace</Typography>
              <Typography variant="h4">{formatCurrency(revenueStats?.marketplaceCommission || 0)}</Typography>
              {revenueStats?.unknownCommission ? (
                <Typography variant="caption" color="text.secondary">
                  Unknown source: {formatCurrency(revenueStats.unknownCommission)}
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default RevenueDashboard
