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
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AdminFetchState from '../../components/AdminFetchState'
import { SHOP_REJECT_SECTIONS } from '../../constants/marketplace'
import { isSuperAdmin } from '../../config/roleAccess'
import { RootState } from '../../store'
import { shopAdminService } from '../../services/shopAdminService'
import { mapError } from '../../services/errorHandlerService'
import type { ShopDetail } from '../../types/marketplace'
import { formatIst, maskUpiId } from '../../utils/marketplaceDisplay'

function DocumentViewButton({ label, href }: { label: string; href?: string | null }) {
  if (!href) {
    return (
      <Typography variant="body2" color="text.secondary">
        {label}: not uploaded
      </Typography>
    )
  }
  return (
    <Button component="a" href={href} target="_blank" rel="noopener noreferrer" size="small" variant="outlined">
      View {label}
    </Button>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2">{value ?? '—'}</Typography>
    </Box>
  )
}

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
  const [upiDiffersMode, setUpiDiffersMode] = useState(false)
  const [differingUpiName, setDifferingUpiName] = useState('')
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

  const userRecord = shop?.user as {
    name?: string
    email?: string
    phone?: string
    isActive?: boolean
    shop?: {
      shopName?: string
      shopType?: string
      approvalStatus?: string
      submitted?: boolean
    }
  } | undefined

  const profile = (shop?.profile || {}) as Record<string, unknown>
  const bank = (profile.bank || {}) as Record<string, unknown>
  const upiVerification = (bank.upiNameVerification || {}) as Record<string, unknown>
  const shopMeta = userRecord?.shop || {}
  const onboarding = shop?.onboardingStatus
  const approvalStatus = shopMeta.approvalStatus || onboarding?.approvalStatus || 'pending'
  const submitted = onboarding?.submitted === true || shopMeta.submitted === true
  const isSuspended = userRecord?.isActive === false
  const upiVerified = shop?.upiVerified === true

  const showApprove = approvalStatus === 'pending' && submitted && upiVerified
  const showReject = approvalStatus === 'pending'
  const showVerifyUpi = !upiVerified
  const showSuspend = !isSuspended
  const showUnsuspend = isSuspended

  const steps = onboarding?.steps || {}
  const stepRows = [
    { key: 'businessDetails', label: 'Business details' },
    { key: 'documents', label: 'Documents' },
    { key: 'bankDetails', label: 'Bank & UPI' },
  ] as const

  const resetUpiDialogState = () => {
    setUpiDiffersMode(false)
    setDifferingUpiName('')
  }

  const closeDialog = () => {
    setDialog(null)
    resetUpiDialogState()
  }

  const openUpiVerifyDialog = () => {
    resetUpiDialogState()
    setDialog('upi')
  }

  const runAction = async (fn: () => Promise<unknown>) => {
    try {
      setActionError(null)
      await fn()
      setDialog(null)
      setReason('')
      setSections([])
      resetUpiDialogState()
      await load()
    } catch (err: unknown) {
      setActionError(mapError({ code: (err as { code?: string })?.code }))
    }
  }

  const shopEnteredUpiName =
    (typeof bank.upiRegisteredName === 'string' && bank.upiRegisteredName.trim()) ||
    (typeof bank.accountHolderName === 'string' && bank.accountHolderName.trim()) ||
    ''

  const fullUpiId =
    typeof bank.upiId === 'string' && bank.upiId.trim() ? bank.upiId.trim() : '—'

  const currentlyVerifiedAs =
    typeof upiVerification.verifiedName === 'string' && upiVerification.verifiedName.trim()
      ? upiVerification.verifiedName.trim()
      : null

  const registeredNameDisplay = shopEnteredUpiName || '—'

  return (
    <Box sx={{ p: 3 }}>
      <Button sx={{ mb: 2 }} onClick={() => navigate('/marketplace/shops')}>← Back to shops</Button>
      <Typography variant="h4" gutterBottom>
        {shopMeta.shopName || userRecord?.name || shopId}
      </Typography>

      <AdminFetchState loading={loading} error={error} onRetry={load} empty={!shop && !loading}>
        {shop && (
          <>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <Chip label={approvalStatus} />
              {isSuspended && <Chip color="warning" label="Suspended" />}
              {upiVerified ? <Chip color="success" label="UPI verified" /> : <Chip label="UPI not verified" />}
              {submitted && <Chip variant="outlined" label="Submitted" />}
            </Box>
            {approvalStatus === 'rejected' && onboarding?.rejectedSections?.length ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Rejected sections: {onboarding.rejectedSections.join(', ')}
                {onboarding.rejectionReason ? ` — ${onboarding.rejectionReason}` : ''}
              </Alert>
            ) : null}

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Business details</Typography>
                    <DetailRow label="Shop name" value={shopMeta.shopName} />
                    <DetailRow label="Category" value={shopMeta.shopType} />
                    <DetailRow label="Address" value={typeof profile.address === 'string' ? profile.address : '—'} />
                    <DetailRow label="Owner name" value={userRecord?.name} />
                    <DetailRow label="Phone" value={userRecord?.phone} />
                    <DetailRow label="Email" value={userRecord?.email} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Bank & UPI</Typography>
                    <DetailRow label="UPI ID" value={maskUpiId(bank.upiId)} />
                    <DetailRow label="Registered name" value={registeredNameDisplay} />
                    {upiVerified && currentlyVerifiedAs ? (
                      <DetailRow label="Verified as" value={currentlyVerifiedAs} />
                    ) : null}
                    <DetailRow
                      label="Verification"
                      value={upiVerified ? 'Verified by admin' : 'Not verified'}
                    />
                    <DetailRow label="Bank" value={typeof bank.bankName === 'string' ? bank.bankName : '—'} />
                    <DetailRow label="IFSC" value={typeof bank.ifsc === 'string' ? bank.ifsc : '—'} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Documents</Typography>
                    <Box display="flex" flexDirection="column" gap={1} alignItems="flex-start">
                      <DocumentViewButton label="GST certificate" href={onboarding?.documents?.gstUrl} />
                      {onboarding?.documents?.gstStatus && (
                        <Typography variant="caption" color="text.secondary">
                          GST status: {onboarding.documents.gstStatus}
                        </Typography>
                      )}
                      <DocumentViewButton label="FSSAI certificate" href={onboarding?.documents?.fssaiUrl} />
                      {onboarding?.documents?.fssaiStatus && (
                        <Typography variant="caption" color="text.secondary">
                          FSSAI status: {onboarding.documents.fssaiStatus}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Onboarding steps</Typography>
                    <List dense disablePadding>
                      {stepRows.map((step) => {
                        const done = steps[step.key] === true
                        return (
                          <ListItem key={step.key} disableGutters>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {done ? (
                                <CheckCircleIcon color="success" fontSize="small" />
                              ) : (
                                <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                              )}
                            </ListItemIcon>
                            <ListItemText primary={step.label} secondary={done ? 'Complete' : 'Incomplete'} />
                          </ListItem>
                        )
                      })}
                    </List>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Last updated: {formatIst(profile.updatedAt)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
            {canMutate && (showApprove || showReject || showVerifyUpi || showSuspend || showUnsuspend) && (
              <Box display="flex" flexWrap="wrap" gap={1}>
                {showApprove && (
                  <Button variant="contained" onClick={() => runAction(() => shopAdminService.approve(shopId!))}>
                    Approve
                  </Button>
                )}
                {showReject && (
                  <Button variant="outlined" onClick={() => setDialog('reject')}>Reject</Button>
                )}
                {showVerifyUpi && (
                  <Button variant="outlined" onClick={openUpiVerifyDialog}>Verify UPI</Button>
                )}
                {showUnsuspend && (
                  <Button variant="outlined" onClick={() => runAction(() => shopAdminService.unsuspend(shopId!))}>
                    Unsuspend
                  </Button>
                )}
                {showSuspend && (
                  <Button variant="outlined" color="warning" onClick={() => setDialog('suspend')}>
                    Suspend
                  </Button>
                )}
              </Box>
            )}
          </>
        )}
      </AdminFetchState>

      <Dialog open={dialog === 'reject'} onClose={closeDialog} maxWidth="sm" fullWidth>
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
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!reason.trim()}
            onClick={() => runAction(() => shopAdminService.reject(shopId!, reason, sections))}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'suspend'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Suspend shop</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
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

      <Dialog open={dialog === 'upi'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Verify UPI name</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Open any UPI app, start a payment to this UPI ID (don&apos;t pay), and check the name it shows.
          </Typography>
          <DetailRow label="UPI ID" value={<Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>{fullUpiId}</Typography>} />
          <DetailRow label="Registered name" value={registeredNameDisplay} />
          {currentlyVerifiedAs ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Currently verified as: {currentlyVerifiedAs}
            </Typography>
          ) : null}
          {upiDiffersMode ? (
            <TextField
              fullWidth
              margin="normal"
              label="Name shown in UPI app"
              required
              value={differingUpiName}
              onChange={(e) => setDifferingUpiName(e.target.value)}
              autoFocus
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          {upiDiffersMode ? (
            <>
              <Button onClick={() => setUpiDiffersMode(false)}>Back</Button>
              <Button
                variant="contained"
                disabled={!differingUpiName.trim()}
                onClick={() =>
                  runAction(() => shopAdminService.verifyUpi(shopId!, differingUpiName.trim()))
                }
              >
                Confirm
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setUpiDiffersMode(true)}>Name differs</Button>
              <Button
                variant="contained"
                disabled={!shopEnteredUpiName}
                onClick={() =>
                  runAction(() => shopAdminService.verifyUpi(shopId!, shopEnteredUpiName))
                }
              >
                Name matches — verify
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MarketplaceShopDetail
