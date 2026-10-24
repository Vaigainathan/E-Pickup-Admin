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
  Divider,
  FormControl,
  InputLabel,
  Link as MuiLink,
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
import { Link as RouterLink } from 'react-router-dom'
import AdminFetchState from '../../components/AdminFetchState'
import { MARKETPLACE_HELP_STATUSES } from '../../constants/marketplace'
import { marketplaceAdminService } from '../../services/marketplaceAdminService'
import { mapError } from '../../services/errorHandlerService'
import type { MarketplaceHelpTicket, MarketplaceOrderDetail } from '../../types/marketplace'
import {
  buildHelpTimeline,
  collectHelpPhotoLinks,
  formatHelpProblem,
  formatHelpReportedItems,
  formatIst,
  helpCustomerContact,
} from '../../utils/marketplaceDisplay'

const PAGE_SIZE = 20

const MarketplaceHelp: React.FC = () => {
  const [tickets, setTickets] = useState<MarketplaceHelpTicket[]>([])
  const [status, setStatus] = useState('')
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCount, setLastCount] = useState(0)
  const [selected, setSelected] = useState<MarketplaceHelpTicket | null>(null)
  const [orderContext, setOrderContext] = useState<MarketplaceOrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolveStatus, setResolveStatus] = useState<'reviewing' | 'resolved'>('reviewing')
  const [outcome, setOutcome] = useState<'no_action' | 'refund'>('no_action')
  const [amount, setAmount] = useState('')
  const [supportNote, setSupportNote] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(
    async (nextOffset: number, append: boolean) => {
      try {
        if (append) setLoadingMore(true)
        else setLoading(true)
        setError(null)
        const result = await marketplaceAdminService.listHelpTickets({
          limit: PAGE_SIZE,
          offset: nextOffset,
          status: status || undefined,
        })
        setLastCount(result.tickets.length)
        setTickets((prev) => (append ? [...prev, ...result.tickets] : result.tickets))
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

  const openTicket = async (ticket: MarketplaceHelpTicket) => {
    try {
      setDetailLoading(true)
      setActionError(null)
      setOrderContext(null)
      const full = await marketplaceAdminService.getHelpTicket(ticket.id)
      setSelected(full)
      if (full.orderId) {
        try {
          setOrderContext(await marketplaceAdminService.getOrder(full.orderId))
        } catch {
          setOrderContext(null)
        }
      }
    } catch (err: unknown) {
      setError(mapError({ code: (err as { code?: string })?.code }))
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setSelected(null)
    setOrderContext(null)
  }

  const ticketRecord = selected as Record<string, unknown> | null
  const orderRecord = orderContext?.order as Record<string, unknown> | undefined
  const orderLineItems = useMemo(
    () => (Array.isArray(orderRecord?.items) ? orderRecord.items : []),
    [orderRecord?.items],
  )
  const photoLinks = useMemo(
    () => (ticketRecord ? collectHelpPhotoLinks(ticketRecord) : []),
    [ticketRecord],
  )
  const timeline = useMemo(() => {
    if (!ticketRecord) return []
    const orderEvents = orderContext?.events as Array<Record<string, unknown>> | undefined
    return buildHelpTimeline(ticketRecord, orderEvents)
  }, [ticketRecord, orderContext?.events])
  const customer = useMemo(() => {
    if (!ticketRecord) return { name: '—', phone: '—' }
    return helpCustomerContact(ticketRecord, orderContext?.customer, orderRecord)
  }, [ticketRecord, orderContext?.customer, orderRecord])

  const resolution = ticketRecord?.resolution as Record<string, unknown> | undefined
  const evidenceCount = Array.isArray(ticketRecord?.evidenceIds) ? ticketRecord.evidenceIds.length : 0

  const submitResolve = async () => {
    if (!selected) return
    try {
      setActionError(null)
      const body: {
        status: 'reviewing' | 'resolved'
        outcome?: 'no_action' | 'refund'
        amount?: number
        supportNote?: string
      } = { status: resolveStatus, supportNote: supportNote.trim() || undefined }
      if (resolveStatus === 'resolved') {
        body.outcome = outcome
        if (outcome === 'refund') {
          body.amount = Number(amount)
        }
      }
      await marketplaceAdminService.resolveHelpTicket(selected.id, body)
      setResolveOpen(false)
      closeDetail()
      load(0, false)
    } catch (err: unknown) {
      setActionError(mapError({ code: (err as { code?: string })?.code }))
    }
  }

  const hasMore = lastCount >= PAGE_SIZE

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Marketplace — Help</Typography>
      <Card sx={{ mb: 2, p: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {MARKETPLACE_HELP_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      <AdminFetchState
        loading={loading && tickets.length === 0}
        error={error}
        onRetry={() => load(0, false)}
        empty={!loading && tickets.length === 0}
        emptyMessage="No marketplace help tickets."
      >
        <TableContainer component={Card}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ticket</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Problem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => openTicket(t)}>
                  <TableCell>{t.id.slice(0, 8)}…</TableCell>
                  <TableCell>{t.displayId || t.orderId}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell>{t.problem}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {hasMore && (
          <Box mt={2} textAlign="center">
            <Button variant="outlined" disabled={loadingMore} onClick={() => load(offset + PAGE_SIZE, true)}>
              Load more
            </Button>
          </Box>
        )}
      </AdminFetchState>

      <Dialog open={Boolean(selected)} onClose={closeDetail} maxWidth="md" fullWidth>
        <DialogTitle>Help ticket</DialogTitle>
        <DialogContent>
          {detailLoading && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Loading ticket…</Typography>
          )}
          {selected && ticketRecord && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Summary</Typography>
                  <Typography variant="body2">Status: {String(selected.status ?? '—')}</Typography>
                  <Typography variant="body2">Created: {formatIst(selected.createdAt)}</Typography>
                  <Typography variant="body2">Priority: {String(ticketRecord.priority ?? '—')}</Typography>
                  {selected.orderId && (
                    <Typography variant="body2">
                      Order:{' '}
                      <MuiLink
                        component={RouterLink}
                        to={`/marketplace/orders/${selected.orderId}`}
                        onClick={closeDetail}
                      >
                        {selected.displayId || selected.orderId}
                      </MuiLink>
                    </Typography>
                  )}
                  <Typography variant="body2">Customer: {customer.name}</Typography>
                  <Typography variant="body2">Phone: {customer.phone}</Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Customer report</Typography>
                  <Typography variant="body2">Problem: {formatHelpProblem(selected.problem)}</Typography>
                  <Typography variant="body2">
                    Items: {formatHelpReportedItems(ticketRecord, orderLineItems)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                    {selected.description || '—'}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle2" gutterBottom>Photos</Typography>
                  {photoLinks.length > 0 ? (
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {photoLinks.map((link) => (
                        <Button
                          key={link.label}
                          component="a"
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          variant="outlined"
                        >
                          View {link.label}
                        </Button>
                      ))}
                    </Box>
                  ) : evidenceCount > 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {evidenceCount} photo(s) attached (preview links not available on this ticket)
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No photos</Typography>
                  )}
                </CardContent>
              </Card>

              {(resolution != null || ticketRecord.refundId != null) && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Refund</Typography>
                    {resolution && (
                      <>
                        <Typography variant="body2">Outcome: {String(resolution.outcome ?? '—')}</Typography>
                        {resolution.refundAmount != null && (
                          <Typography variant="body2">Amount: {String(resolution.refundAmount)}</Typography>
                        )}
                        <Typography variant="body2">
                          Decided: {formatIst(resolution.decidedAt)}
                        </Typography>
                      </>
                    )}
                    {ticketRecord.refundId != null && (
                      <Typography variant="body2">Refund ID: {String(ticketRecord.refundId)}</Typography>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>History</Typography>
                  {timeline.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No history</Typography>
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
                        {timeline.map((row, index) => (
                          <TableRow key={`${String(row.type)}-${index}`}>
                            <TableCell>{formatIst(row.at)}</TableCell>
                            <TableCell>{row.type}</TableCell>
                            <TableCell>{row.actor}</TableCell>
                            <TableCell>{row.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
          {actionError && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetail}>Close</Button>
          <Button variant="contained" onClick={() => setResolveOpen(true)} disabled={!selected}>
            Resolve / update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resolveOpen} onClose={() => setResolveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve help ticket</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={resolveStatus}
              onChange={(e) => setResolveStatus(e.target.value as 'reviewing' | 'resolved')}
            >
              <MenuItem value="reviewing">reviewing</MenuItem>
              <MenuItem value="resolved">resolved</MenuItem>
            </Select>
          </FormControl>
          {resolveStatus === 'resolved' && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Outcome</InputLabel>
                <Select
                  label="Outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as 'no_action' | 'refund')}
                >
                  <MenuItem value="no_action">no_action</MenuItem>
                  <MenuItem value="refund">refund</MenuItem>
                </Select>
              </FormControl>
              {outcome === 'refund' && (
                <TextField fullWidth margin="normal" label="Refund amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              )}
            </>
          )}
          <TextField fullWidth margin="normal" label="Support note" multiline rows={3} value={supportNote} onChange={(e) => setSupportNote(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitResolve}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MarketplaceHelp
