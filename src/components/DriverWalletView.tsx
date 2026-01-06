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
  Chip,
  Grid,
  Button,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { comprehensiveAdminService } from '../services/comprehensiveAdminService'
import { AdminColors } from '../constants/Colors'

interface DriverWalletViewProps {
  driverId: string
  driverName?: string
}

interface WalletData {
  wallet: {
    balance: number
    totalEarned: number
    totalSpent: number
    requiresTopUp: boolean
    canWork: boolean
    lastUpdated?: string
  }
  transactions: any[]
  topUps: any[]
  statistics: {
    totalCommission: number
    totalTopUps: number
    transactionCount: number
    topUpCount: number
    averageTopUp: number
  }
}

const DriverWalletView: React.FC<DriverWalletViewProps> = ({ driverId, driverName }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  const loadWalletData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await comprehensiveAdminService.getDriverWallet?.(driverId) || 
                       await fetch(`/api/admin/drivers/${driverId}/wallet`).then(r => r.json())
      
      if (response.success && response.data) {
        setWalletData(response.data)
      } else {
        setError(response.error?.message || 'Failed to load wallet data')
      }
    } catch (err) {
      console.error('Error loading wallet data:', err)
      setError('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWalletData()
  }, [driverId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
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
          <Button color="inherit" size="small" onClick={loadWalletData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    )
  }

  if (!walletData) {
    return <Alert severity="info">No wallet data available</Alert>
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Wallet Details {driverName && `- ${driverName}`}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={loadWalletData}
        >
          Refresh
        </Button>
      </Box>

      {/* Wallet Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Current Balance
              </Typography>
              <Typography variant="h5" fontWeight="bold" color={AdminColors.primary}>
                {formatCurrency(walletData.wallet.balance)}
              </Typography>
              <Chip
                label={walletData.wallet.canWork ? 'Can Work' : 'Cannot Work'}
                color={walletData.wallet.canWork ? 'success' : 'error'}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Total Added
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#4CAF50">
                {formatCurrency(walletData.wallet.totalEarned)}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                {walletData.statistics.topUpCount} top-ups
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Total Spent
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#F44336">
                {formatCurrency(walletData.wallet.totalSpent)}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                {walletData.statistics.transactionCount} transactions
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
              <Typography variant="h5" fontWeight="bold" color="#FF9800">
                {formatCurrency(walletData.statistics.totalCommission)}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Average: {formatCurrency(walletData.statistics.averageTopUp)} per top-up
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Transactions and Top-ups */}
      <Card>
        <Tabs value={activeTab} onChange={(_e, newValue) => setActiveTab(newValue)}>
          <Tab label={`Transactions (${walletData.transactions.length})`} />
          <Tab label={`Top-ups (${walletData.topUps.length})`} />
        </Tabs>

        <CardContent>
          {activeTab === 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {walletData.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="textSecondary" py={2}>
                          No transactions found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    walletData.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.type === 'credit' ? 'Credit' : 'Debit'}
                            color={transaction.type === 'credit' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{transaction.description || 'Transaction'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {transaction.type === 'credit' ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount || transaction.pointsAmount || 0))}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(transaction.newBalance || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 1 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Transaction ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {walletData.topUps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="textSecondary" py={2}>
                          No top-ups found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    walletData.topUps.map((topUp) => (
                      <TableRow key={topUp.id}>
                        <TableCell>{formatDate(topUp.createdAt)}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(topUp.amount || 0)}
                        </TableCell>
                        <TableCell>{topUp.paymentMethod || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={topUp.status || 'pending'}
                            color={
                              topUp.status === 'completed' ? 'success' :
                              topUp.status === 'failed' ? 'error' : 'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {topUp.phonepeTransactionId || topUp.id}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default DriverWalletView

