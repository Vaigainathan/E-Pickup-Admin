import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AdminFetchState from '../../components/AdminFetchState'
import { SHOP_EARNINGS_PERIODS, type ShopEarningsPeriod } from '../../constants/marketplace'
import { marketplaceAdminService } from '../../services/marketplaceAdminService'
import { ApiRequestError } from '../../services/apiService'
import { isQuietForbiddenError } from '../../utils/quietForbiddenError'
import { formatInrCurrency } from '../../utils/formatInrCurrency'
import type { ShopEarningsListRow } from '../../types/marketplace'
import { RootState } from '../../store'

const MarketplaceShopEarnings: React.FC = () => {
  const navigate = useNavigate()
  const role = useSelector((state: RootState) => state.auth.user?.role)
  const [period, setPeriod] = useState<ShopEarningsPeriod>('thisMonth')
  const [shops, setShops] = useState<ShopEarningsListRow[]>([])
  const [asOf, setAsOf] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await marketplaceAdminService.listShopEarnings(period)
      setShops(data.shops ?? [])
      setAsOf(data.asOf ?? null)
    } catch (err: unknown) {
      if (isQuietForbiddenError(err, role)) {
        console.warn('Shop earnings list forbidden for role', role)
        setShops([])
        setAsOf(null)
        return
      }
      const message =
        err instanceof ApiRequestError ? err.message : 'Failed to load shop earnings'
      setError(message)
      setShops([])
    } finally {
      setLoading(false)
    }
  }, [period, role])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Marketplace — Shop earnings
      </Typography>
      {asOf ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          As of {new Date(asOf).toLocaleString('en-IN')}
        </Typography>
      ) : null}

      <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
        <InputLabel id="shop-earnings-period">Period</InputLabel>
        <Select
          labelId="shop-earnings-period"
          label="Period"
          value={period}
          onChange={(e) => setPeriod(e.target.value as ShopEarningsPeriod)}
        >
          {SHOP_EARNINGS_PERIODS.map((p) => (
            <MenuItem key={p.value} value={p.value}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <AdminFetchState
        loading={loading && shops.length === 0}
        error={error}
        onRetry={load}
        empty={!loading && !error && shops.length === 0}
        emptyMessage="No shop earnings for this period."
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Shop</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Received</TableCell>
                <TableCell align="right">Refunded</TableCell>
                <TableCell align="right">Net</TableCell>
                <TableCell align="right">Paid orders</TableCell>
                <TableCell align="right">Refunds due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shops.map((row) => (
                <TableRow
                  key={row.shopId}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/marketplace/shops/${row.shopId}`)}
                >
                  <TableCell>{row.shopName}</TableCell>
                  <TableCell>
                    <Chip label={row.approvalStatus} size="small" />
                  </TableCell>
                  <TableCell align="right">{formatInrCurrency(row.received)}</TableCell>
                  <TableCell align="right">{formatInrCurrency(row.refunded)}</TableCell>
                  <TableCell align="right">{formatInrCurrency(row.net)}</TableCell>
                  <TableCell align="right">{row.paidOrders}</TableCell>
                  <TableCell align="right">
                    {row.refundsDue?.count ?? 0} ({formatInrCurrency(row.refundsDue?.amount ?? 0)})
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AdminFetchState>
    </Box>
  )
}

export default MarketplaceShopEarnings
