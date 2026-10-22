import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import AdminFetchState from '../../components/AdminFetchState'
import { MARKETPLACE_HELP_STATUSES } from '../../constants/marketplace'
import { marketplaceAdminService } from '../../services/marketplaceAdminService'
import { mapError } from '../../services/errorHandlerService'
import type { MarketplaceHelpTicket } from '../../types/marketplace'

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
      const full = await marketplaceAdminService.getHelpTicket(ticket.id)
      setSelected(full)
    } catch (err: unknown) {
      setError(mapError({ code: (err as { code?: string })?.code }))
    }
  }

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
      setSelected(null)
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

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>Help ticket</DialogTitle>
        <DialogContent>
          {selected && (
            <pre style={{ fontSize: 12, overflow: 'auto', maxHeight: 400 }}>
              {JSON.stringify(selected, null, 2)}
            </pre>
          )}
          {actionError && <Typography color="error">{actionError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
          <Button variant="contained" onClick={() => setResolveOpen(true)}>Resolve / update</Button>
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
