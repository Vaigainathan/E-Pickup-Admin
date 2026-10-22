import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AdminFetchState from '../../components/AdminFetchState'
import { SHOP_REJECT_SECTIONS } from '../../constants/marketplace'
import { isSuperAdmin } from '../../config/roleAccess'
import { RootState } from '../../store'
import { shopAdminService } from '../../services/shopAdminService'
import { mapError } from '../../services/errorHandlerService'
import type { ShopDetail } from '../../types/marketplace'

const MarketplaceShopDetail: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const canMutate = isSuperAdmin(user?.role)

  const [shop, setShop] = useState<ShopDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'reject' | 'suspend' | 'upi' | null>(null)
  const [reason, setReason] = useState('')
  const [verifiedName, setVerifiedName] = useState('')
  const [sections, setSections] = useState<string[]>([])

  const load = useCallback(async () => {
    if (!shopId) return
    try {
      setLoading(true)
      setError(null)
      setShop(await shopAdminService.getShop(shopId))
    } catch (err: unknown) {
      setError(mapError({ code: (err as { code?: string })?.code }))
    } finally {
      setLoading(false)
    }
  }, [shopId])

  useEffect(() => {
    load()
  }, [load])

  const userRecord = shop?.user as { isActive?: boolean; shop?: { shopName?: string; approvalStatus?: string } } | undefined
  const isSuspended = userRecord?.isActive === false

  const runAction = async (fn: () => Promise<unknown>) => {
    try {
      setActionError(null)
      await fn()
      setDialog(null)
      setReason('')
      setSections([])
      await load()
    } catch (err: unknown) {
      setActionError(mapError({ code: (err as { code?: string })?.code }))
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button sx={{ mb: 2 }} onClick={() => navigate('/marketplace/shops')}>← Back to shops</Button>
      <Typography variant="h4" gutterBottom>
        {userRecord?.shop?.shopName || shopId}
      </Typography>

      <AdminFetchState loading={loading} error={error} onRetry={load} empty={!shop && !loading}>
        {shop && (
          <>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <Chip label={userRecord?.shop?.approvalStatus || 'pending'} />
              {isSuspended && <Chip color="warning" label="Suspended" />}
              {shop.upiVerified && <Chip color="success" label="UPI verified" />}
            </Box>
            {shop.onboardingStatus?.rejectedSections?.length ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Rejected sections: {shop.onboardingStatus.rejectedSections.join(', ')}
              </Alert>
            ) : null}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Onboarding</Typography>
                <pre style={{ fontSize: 12, overflow: 'auto', maxHeight: 320 }}>
                  {JSON.stringify(shop.onboardingStatus, null, 2)}
                </pre>
              </CardContent>
            </Card>
            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
            {canMutate && (
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Button variant="contained" onClick={() => runAction(() => shopAdminService.approve(shopId!))}>
                  Approve
                </Button>
                <Button variant="outlined" onClick={() => setDialog('reject')}>Reject</Button>
                <Button variant="outlined" onClick={() => setDialog('upi')}>Verify UPI</Button>
                {isSuspended ? (
                  <Button variant="outlined" onClick={() => runAction(() => shopAdminService.unsuspend(shopId!))}>
                    Unsuspend
                  </Button>
                ) : (
                  <Button variant="outlined" color="warning" onClick={() => setDialog('suspend')}>
                    Suspend
                  </Button>
                )}
              </Box>
            )}
          </>
        )}
      </AdminFetchState>

      <Dialog open={dialog === 'reject'} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject shop</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
          <FormGroup>
            {SHOP_REJECT_SECTIONS.map((s) => (
              <FormControlLabel
                key={s}
                control={
                  <Checkbox
                    checked={sections.includes(s)}
                    onChange={(e) => {
                      setSections((prev) =>
                        e.target.checked ? [...prev, s] : prev.filter((x) => x !== s),
                      )
                    }}
                  />
                }
                label={s}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!reason.trim()}
            onClick={() => runAction(() => shopAdminService.reject(shopId!, reason, sections))}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'suspend'} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Suspend shop</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={!reason.trim()}
            onClick={() => runAction(() => shopAdminService.suspend(shopId!, reason))}
          >
            Suspend
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'upi'} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Verify UPI name</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Verified name"
            required
            value={verifiedName}
            onChange={(e) => setVerifiedName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!verifiedName.trim()}
            onClick={() => runAction(() => shopAdminService.verifyUpi(shopId!, verifiedName.trim()))}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MarketplaceShopDetail
