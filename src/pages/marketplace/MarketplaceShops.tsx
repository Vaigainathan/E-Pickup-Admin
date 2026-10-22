import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
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
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AdminFetchState from '../../components/AdminFetchState'
import { SHOP_APPROVAL_STATUSES } from '../../constants/marketplace'
import { shopAdminService } from '../../services/shopAdminService'
import { mapError } from '../../services/errorHandlerService'
import type { ShopListItem } from '../../types/marketplace'

const PAGE_SIZE = 20

const MarketplaceShops: React.FC = () => {
  const navigate = useNavigate()
  const [shops, setShops] = useState<ShopListItem[]>([])
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [approvalFilter, setApprovalFilter] = useState<string>('')
  const [suspendedOnly, setSuspendedOnly] = useState(false)
  const [nameSearch, setNameSearch] = useState('')
  const [lastPageCount, setLastPageCount] = useState(0)

  const load = useCallback(
    async (nextOffset: number, append: boolean) => {
      try {
        if (append) setLoadingMore(true)
        else setLoading(true)
        setError(null)
        const result = await shopAdminService.listShops({
          limit: PAGE_SIZE,
          offset: nextOffset,
          approvalStatus: approvalFilter || undefined,
          nameSearch: nameSearch.trim() || undefined,
        })
        setLastPageCount(result.shops.length)
        setShops((prev) => (append ? [...prev, ...result.shops] : result.shops))
        setOffset(nextOffset)
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code
        setError(mapError({ code, message: err instanceof Error ? err.message : undefined }))
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [approvalFilter, nameSearch],
  )

  useEffect(() => {
    load(0, false)
  }, [load])

  const visibleShops = useMemo(() => {
    if (!suspendedOnly) return shops
    return shops.filter((s) => s.isActive === false)
  }, [shops, suspendedOnly])

  const hasMore = lastPageCount >= PAGE_SIZE

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Marketplace — Shops</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Approval</InputLabel>
              <Select
                label="Approval"
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {SHOP_APPROVAL_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Chip
              label="Suspended (this page)"
              color={suspendedOnly ? 'warning' : 'default'}
              onClick={() => setSuspendedOnly((v) => !v)}
              variant={suspendedOnly ? 'filled' : 'outlined'}
            />
            <TextField
              size="small"
              label="Name search"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(0, false)}
            />
            <Button variant="outlined" onClick={() => load(0, false)}>Apply</Button>
          </Box>
        </CardContent>
      </Card>

      <AdminFetchState
        loading={loading && shops.length === 0}
        error={error}
        onRetry={() => load(0, false)}
        empty={!loading && visibleShops.length === 0}
        emptyMessage="No shops match your filters."
      >
        <TableContainer component={Card}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Shop</TableCell>
                <TableCell>Approval</TableCell>
                <TableCell>UPI</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleShops.map((shop) => (
                <TableRow
                  key={shop.shopId}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/marketplace/shops/${shop.shopId}`)}
                >
                  <TableCell>{shop.shopName || shop.shopId}</TableCell>
                  <TableCell>
                    <Chip size="small" label={shop.approvalStatus} />
                  </TableCell>
                  <TableCell>{shop.upiVerified ? 'Verified' : '—'}</TableCell>
                  <TableCell>
                    {shop.isActive === false ? (
                      <Chip size="small" color="warning" label="Suspended" />
                    ) : (
                      <Chip size="small" color="success" label="Active" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {hasMore && !suspendedOnly && (
          <Box mt={2} textAlign="center">
            <Button
              variant="outlined"
              disabled={loadingMore}
              onClick={() => load(offset + PAGE_SIZE, true)}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </Box>
        )}
      </AdminFetchState>
    </Box>
  )
}

export default MarketplaceShops
