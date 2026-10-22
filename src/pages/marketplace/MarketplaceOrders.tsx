import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import AdminFetchState from '../../components/AdminFetchState'
import { MARKETPLACE_ORDER_STATUSES } from '../../constants/marketplace'
import { marketplaceAdminService } from '../../services/marketplaceAdminService'
import { mapError } from '../../services/errorHandlerService'
import type { MarketplaceEnforcement, MarketplaceOrderSummary } from '../../types/marketplace'

const PAGE_SIZE = 20

const MarketplaceOrders: React.FC = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<MarketplaceOrderSummary[]>([])
  const [offset, setOffset] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCount, setLastCount] = useState(0)
  const [enforcement, setEnforcement] = useState<MarketplaceEnforcement | null>(null)

  const load = useCallback(
    async (nextOffset: number, append: boolean) => {
      try {
        if (append) setLoadingMore(true)
        else setLoading(true)
        setError(null)
        const result = await marketplaceAdminService.listOrders({
          limit: PAGE_SIZE,
          offset: nextOffset,
          status: status || undefined,
        })
        setLastCount(result.orders.length)
        setOrders((prev) => (append ? [...prev, ...result.orders] : result.orders))
        setOffset(nextOffset)
      } catch (err: unknown) {
        setError(mapError({ code: (err as { code?: string })?.code }))
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [status],
  )

  useEffect(() => {
    load(0, false)
  }, [load])

  useEffect(() => {
    marketplaceAdminService.getEnforcement().then(setEnforcement).catch(() => {})
  }, [])

  const hasMore = lastCount >= PAGE_SIZE

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Marketplace — Orders</Typography>
      {enforcement && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Enforcement: newStatuses={enforcement.enforcement.newStatuses ? 'on' : 'off'},
          utrBlocksReject={enforcement.enforcement.utrBlocksReject ? 'on' : 'off'}
        </Alert>
      )}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Order status</InputLabel>
            <Select label="Order status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {MARKETPLACE_ORDER_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <AdminFetchState
        loading={loading && orders.length === 0}
        error={error}
        onRetry={() => load(0, false)}
        empty={!loading && orders.length === 0}
        emptyMessage="No marketplace orders found."
      >
        <TableContainer component={Card}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>UTR</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow
                  key={o.orderId}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/marketplace/orders/${o.orderId}`)}
                >
                  <TableCell>{o.displayId || o.orderId}</TableCell>
                  <TableCell><Chip size="small" label={o.orderStatus || '—'} /></TableCell>
                  <TableCell>{o.amount != null ? `₹${o.amount}` : '—'}</TableCell>
                  <TableCell>{o.customerUtrLast4 ? `…${o.customerUtrLast4}` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {hasMore && (
          <Box mt={2} textAlign="center">
            <Button variant="outlined" disabled={loadingMore} onClick={() => load(offset + PAGE_SIZE, true)}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </Box>
        )}
      </AdminFetchState>
    </Box>
  )
}

export default MarketplaceOrders
