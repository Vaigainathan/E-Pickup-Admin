import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AdminFetchState from '../../components/AdminFetchState'
import { marketplaceAdminService } from '../../services/marketplaceAdminService'
import { mapError } from '../../services/errorHandlerService'
import { RootState } from '../../store'
import type { MarketplaceOrderDetail } from '../../types/marketplace'
import {
  eventReason,
  formatActor,
  formatIst,
  humanizeEventType,
  utrDisplay,
} from '../../utils/marketplaceDisplay'

type PaymentReviewOutcome = 'found' | 'not_found' | 'refund'
type DisputeOutcome = 'received' | 'resend'

const TERMINAL_ORDER_STATUSES = new Set(['completed', 'cancelled', 'delivery_failed'])

const MarketplaceOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const operator = user?.uid || user?.id || ''

  const [detail, setDetail] = useState<MarketplaceOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [paymentReviewOutcome, setPaymentReviewOutcome] = useState<PaymentReviewOutcome>('found')
  const [disputeOutcome, setDisputeOutcome] = useState<DisputeOutcome>('received')
  const [disputeResendTo, setDisputeResendTo] = useState<'due' | 'upi_needed'>('due')
  const [refundUtr, setRefundUtr] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [selectedRefundId, setSelectedRefundId] = useState('')

  const load = useCallback(async () => {
    if (!orderId) return
    try {
      setLoading(true)
      setError(null)
      setDetail(await marketplaceAdminService.getOrder(orderId))
    } catch (err: unknown) {
      setError(mapError({ code: (err as { code?: string })?.code }))
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    load()
  }, [load])

  const orderRecord = detail?.order as Record<string, unknown> | undefined
  const cancellation = (orderRecord?.cancellation || {}) as Record<string, unknown>
  const orderStatus = detail?.summary?.orderStatus || ''

  const showPaymentReview = orderStatus === 'payment_review'
  const showPaidCheck =
    orderStatus === 'cancelled' &&
    cancellation.reason === 'customer_cancel' &&
    cancellation.paidCheck === 'pending'
  const showCancel = detail && !TERMINAL_ORDER_STATUSES.has(orderStatus)

  const dueRefunds = useMemo(
    () => detail?.refunds.filter((r) => String(r.status) === 'due') ?? [],
    [detail?.refunds],
  )
  const disputedRefunds = useMemo(
    () => detail?.refunds.filter((r) => String(r.status) === 'disputed') ?? [],
    [detail?.refunds],
  )
  const firstDueRefund = dueRefunds[0]
  const firstDisputedRefund = disputedRefunds[0]

  const resetDialogFields = () => {
    setReason('')
    setPaymentReviewOutcome('found')
    setDisputeOutcome('received')
    setDisputeResendTo('due')
    setRefundUtr('')
    setRefundAmount('')
    setSelectedRefundId('')
  }

  const closeConfirm = () => {
    setConfirm(null)
    resetDialogFields()
  }

  const run = async (fn: () => Promise<unknown>) => {
    try {
      setActionError(null)
      await fn()
      closeConfirm()
      await load()
    } catch (err: unknown) {
      setActionError(mapError({ code: (err as { code?: string })?.code }))
    }
  }

  const payment = (detail?.order?.payment || {}) as Record<string, unknown>
  const orderItems = useMemo(() => {
    const items = orderRecord?.items
    return Array.isArray(items) ? items : []
  }, [orderRecord?.items])

  const paymentTimestamps = useMemo(() => {
    const fields = [
      { key: 'initiatedAt', label: 'Initiated' },
      { key: 'utrSubmittedAt', label: 'UTR submitted' },
      { key: 'confirmedAt', label: 'Confirmed' },
      { key: 'expiredAt', label: 'Expired' },
      { key: 'refundedAt', label: 'Refunded' },
    ]
    return fields.filter((f) => payment[f.key] != null)
  }, [payment])

  const openRefundSent = (refundId: string, amount: unknown) => {
    setSelectedRefundId(refundId)
    setRefundAmount(String(amount ?? ''))
    setConfirm('refund-sent')
  }

  const openDisputeResolve = (refundId: string) => {
    setSelectedRefundId(refundId)
    setDisputeOutcome('received')
    setDisputeResendTo('due')
    setConfirm('dispute-resolve')
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button sx={{ mb: 2 }} onClick={() => navigate('/marketplace/orders')}>← Orders</Button>
      <Typography variant="h4" gutterBottom>
        Order {detail?.summary?.displayId || orderId}
      </Typography>
      <AdminFetchState loading={loading} error={error} onRetry={load} empty={!detail && !loading}>
        {detail && (
          <>
            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Summary</Typography>
                <Typography variant="body2">Status: {detail.summary.orderStatus || '—'}</Typography>
                <Typography variant="body2">Order ID: {detail.summary.displayId || detail.summary.orderId}</Typography>
                <Typography variant="body2">Created: {formatIst(orderRecord?.createdAt)}</Typography>
                <Typography variant="body2">Updated: {formatIst(orderRecord?.updatedAt)}</Typography>
                {detail.summary.linkedBookingId && (
                  <Typography variant="body2">
                    Linked booking:{' '}
                    <Link href={`/bookings`} onClick={(e) => { e.preventDefault(); navigate('/bookings') }}>
                      {detail.summary.linkedBookingId}
                    </Link>
                  </Typography>
                )}
              </CardContent>
            </Card>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Customer</Typography>
                <Typography variant="body2">Name: {detail.customer?.name || '—'}</Typography>
                <Typography variant="body2">Phone: {detail.customer?.phone || '—'}</Typography>
                <Typography variant="body2">Email: {detail.customer?.email || '—'}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Shop</Typography>
                <Typography variant="body2">Name: {detail.shop?.name || '—'}</Typography>
                <Typography variant="body2">Phone: {detail.shop?.phone || '—'}</Typography>
                <Typography variant="body2">Shop ID: {detail.summary.shopId || '—'}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Items</Typography>
                {orderItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No line items</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Variant</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderItems.map((line, index) => {
                        const row = line as Record<string, unknown>
                        const variant =
                          row.variantValue != null
                            ? `${row.variantLabel ?? ''}: ${row.variantValue}`.trim()
                            : '—'
                        return (
                          <TableRow key={String(row.id ?? index)}>
                            <TableCell>{String(row.name ?? '—')}</TableCell>
                            <TableCell>{variant || '—'}</TableCell>
                            <TableCell align="right">{String(row.qty ?? '—')}</TableCell>
                            <TableCell align="right">{String(row.price ?? '—')}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Items total: {String(orderRecord?.itemsTotal ?? payment.amount ?? detail.summary.amount ?? '—')}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Payment</Typography>
                <Typography variant="body2">Status: {String(payment.status ?? '—')}</Typography>
                <Typography variant="body2">
                  Amount: {String(payment.amount ?? detail.summary.amount ?? '—')}
                </Typography>
                <Typography variant="body2">
                  UTR: {utrDisplay(payment, orderStatus)}
                </Typography>
                {paymentTimestamps.map((row) => (
                  <Typography key={row.key} variant="body2">
                    {row.label}: {formatIst(payment[row.key])}
                  </Typography>
                ))}
              </CardContent>
            </Card>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Refunds</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Due by</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.refunds.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{String(r.status)}</TableCell>
                        <TableCell>{String(r.amount ?? '')}</TableCell>
                        <TableCell>{formatIst(r.dueBy)}</TableCell>
                        <TableCell align="right">
                          {String(r.status) === 'due' && (
                            <Button size="small" onClick={() => openRefundSent(r.id, r.amount)}>Mark sent</Button>
                          )}
                          {String(r.status) === 'disputed' && (
                            <Button size="small" onClick={() => openDisputeResolve(r.id)}>Resolve dispute</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Events</Typography>
                {detail.events.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No events</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time (IST)</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Actor</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.events.map((ev, index) => {
                        const event = ev as Record<string, unknown>
                        return (
                          <TableRow key={String(event.id ?? index)}>
                            <TableCell>{formatIst(event.at)}</TableCell>
                            <TableCell>{humanizeEventType(event.type)}</TableCell>
                            <TableCell>{formatActor(event.actor)}</TableCell>
                            <TableCell>{eventReason(event)}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {showCancel && (
                <Button variant="outlined" color="error" onClick={() => setConfirm('cancel')}>Cancel order</Button>
              )}
              {showPaymentReview && (
                <Button variant="outlined" onClick={() => setConfirm('payment-review')}>Resolve payment review</Button>
              )}
              {showPaidCheck && (
                <>
                  <Button variant="outlined" onClick={() => setConfirm('paid-check-received')}>Paid check: received</Button>
                  <Button variant="outlined" onClick={() => setConfirm('paid-check-not')}>Paid check: not received</Button>
                </>
              )}
              {firstDueRefund && (
                <Button
                  variant="outlined"
                  onClick={() => openRefundSent(firstDueRefund.id, firstDueRefund.amount)}
                >
                  Mark refund sent
                </Button>
              )}
              {firstDisputedRefund && (
                <Button variant="outlined" onClick={() => openDisputeResolve(firstDisputedRefund.id)}>
                  Resolve refund dispute
                </Button>
              )}
            </Box>
          </>
        )}
      </AdminFetchState>

      <Dialog open={confirm === 'cancel'} onClose={closeConfirm}>
        <DialogTitle>Cancel order?</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Back</Button>
          <Button color="error" variant="contained" onClick={() => run(() => marketplaceAdminService.cancelOrder(orderId!, reason))}>
            Confirm cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirm === 'payment-review'} onClose={closeConfirm} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve payment review</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="payment-review-outcome-label">Outcome</InputLabel>
            <Select
              labelId="payment-review-outcome-label"
              label="Outcome"
              value={paymentReviewOutcome}
              onChange={(e) => setPaymentReviewOutcome(e.target.value as PaymentReviewOutcome)}
            >
              <MenuItem value="found">Payment found</MenuItem>
              <MenuItem value="not_found">Payment not found</MenuItem>
              <MenuItem value="refund">Refund customer</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            required
            label="Reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Back</Button>
          <Button
            variant="contained"
            disabled={!reason.trim()}
            onClick={() =>
              run(() =>
                marketplaceAdminService.resolvePaymentReview(orderId!, {
                  outcome: paymentReviewOutcome,
                  reason: reason.trim(),
                }),
              )
            }
          >
            Confirm resolve
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirm === 'paid-check-received'} onClose={closeConfirm}>
        <DialogTitle>Paid check — payment received</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Uses operator UID and empty body per contract.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Back</Button>
          <Button
            variant="contained"
            onClick={() =>
              run(() =>
                marketplaceAdminService.resolvePaidCheck(orderId!, {
                  outcome: 'received',
                  operator,
                  body: {},
                }),
              )
            }
          >
            Confirm received
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirm === 'paid-check-not'} onClose={closeConfirm}>
        <DialogTitle>Paid check — not received</DialogTitle>
        <DialogActions>
          <Button onClick={closeConfirm}>Back</Button>
          <Button
            variant="contained"
            onClick={() =>
              run(() =>
                marketplaceAdminService.resolvePaidCheck(orderId!, {
                  outcome: 'not_received',
                  operator,
                  body: {},
                }),
              )
            }
          >
            Confirm not received
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirm === 'refund-sent'} onClose={closeConfirm} maxWidth="sm" fullWidth>
        <DialogTitle>Record refund sent</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Refund ID" value={selectedRefundId} onChange={(e) => setSelectedRefundId(e.target.value)} />
          <TextField fullWidth margin="normal" label="12-digit UTR" value={refundUtr} onChange={(e) => setRefundUtr(e.target.value)} />
          <TextField fullWidth margin="normal" label="Amount" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
          <TextField fullWidth margin="normal" label="Note (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Back</Button>
          <Button
            variant="contained"
            onClick={() =>
              run(() =>
                marketplaceAdminService.recordRefundSent(orderId!, selectedRefundId, {
                  refundUtr: refundUtr.trim(),
                  amount: Number(refundAmount),
                  reason: reason.trim() || undefined,
                }),
              )
            }
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirm === 'dispute-resolve'} onClose={closeConfirm} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve refund dispute</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>Refund: {selectedRefundId}</Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel id="dispute-outcome-label">Outcome</InputLabel>
            <Select
              labelId="dispute-outcome-label"
              label="Outcome"
              value={disputeOutcome}
              onChange={(e) => setDisputeOutcome(e.target.value as DisputeOutcome)}
            >
              <MenuItem value="received">Customer received refund</MenuItem>
              <MenuItem value="resend">Resend refund</MenuItem>
            </Select>
          </FormControl>
          {disputeOutcome === 'resend' && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="dispute-resend-to-label">Resend to</InputLabel>
              <Select
                labelId="dispute-resend-to-label"
                label="Resend to"
                value={disputeResendTo}
                onChange={(e) => setDisputeResendTo(e.target.value as 'due' | 'upi_needed')}
              >
                <MenuItem value="due">Due (shop sends UTR)</MenuItem>
                <MenuItem value="upi_needed">UPI needed (collect customer UPI)</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Back</Button>
          <Button
            variant="contained"
            disabled={disputeOutcome === 'resend' && !disputeResendTo}
            onClick={() =>
              run(() =>
                marketplaceAdminService.resolveRefundDispute(orderId!, selectedRefundId, {
                  outcome: disputeOutcome,
                  ...(disputeOutcome === 'resend' ? { to: disputeResendTo } : {}),
                }),
              )
            }
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MarketplaceOrderDetailPage
