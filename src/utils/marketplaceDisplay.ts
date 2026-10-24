/** Shared formatting for marketplace admin views (IST, masking, timestamps). */

export function parseAdminDate(value: unknown): Date | null {
  if (value == null) return null
  if (typeof value === 'object' && value !== null && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const d = (value as { toDate: () => Date }).toDate()
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'object' && value !== null) {
    const sec = (value as { _seconds?: number; seconds?: number })._seconds
      ?? (value as { seconds?: number }).seconds
    if (typeof sec === 'number') {
      const d = new Date(sec * 1000)
      return Number.isNaN(d.getTime()) ? null : d
    }
  }
  return null
}

export function formatIst(value: unknown): string {
  const date = parseAdminDate(value)
  if (!date) return '—'
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function maskUpiId(upiId: unknown): string {
  if (typeof upiId !== 'string' || !upiId.trim()) return '—'
  const trimmed = upiId.trim()
  const at = trimmed.indexOf('@')
  if (at <= 0) return '••••'
  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at)
  if (local.length <= 2) return `••${domain}`
  return `${local.slice(0, 2)}••••${domain}`
}

export function utrDisplay(
  payment: Record<string, unknown>,
  orderStatus: string,
): string {
  const utr =
    (typeof payment.officialUtr === 'string' && payment.officialUtr) ||
    (typeof payment.customerUtr === 'string' && payment.customerUtr) ||
    ''
  if (!utr) return '—'
  const needsFull = orderStatus === 'payment_review' || orderStatus === 'payment_unconfirmed'
  if (needsFull) return utr
  if (utr.length <= 4) return utr
  return `•••• ${utr.slice(-4)}`
}

export function formatActor(actor: unknown): string {
  if (!actor || typeof actor !== 'object') return '—'
  const a = actor as Record<string, unknown>
  const type = typeof a.type === 'string' ? a.type : 'system'
  if (type === 'support') return 'Support'
  if (type === 'customer') return 'Customer'
  if (type === 'shop') return 'Shop'
  if (type === 'system') return 'System'
  return type
}

export function humanizeEventType(type: unknown): string {
  if (typeof type !== 'string' || !type) return '—'
  return type.replace(/_/g, ' ')
}

export function eventReason(event: Record<string, unknown>): string {
  if (typeof event.reason === 'string' && event.reason.trim()) return event.reason.trim()
  const data = event.data
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (typeof d.reason === 'string' && d.reason.trim()) return d.reason.trim()
    if (typeof d.note === 'string' && d.note.trim()) return d.note.trim()
  }
  return '—'
}

export interface HelpPhotoLink {
  label: string
  href: string
}

function pushPhotoLink(links: HelpPhotoLink[], href: unknown, label: string) {
  if (typeof href === 'string' && /^https?:\/\//i.test(href.trim())) {
    links.push({ label, href: href.trim() })
  }
}

/** Collect viewable photo URLs from ticket payloads (never expose raw storage paths as link text). */
export function collectHelpPhotoLinks(ticket: Record<string, unknown>): HelpPhotoLink[] {
  const links: HelpPhotoLink[] = []
  const photos = ticket.evidencePhotos
  if (Array.isArray(photos)) {
    photos.forEach((entry, index) => {
      if (entry && typeof entry === 'object') {
        const row = entry as Record<string, unknown>
        pushPhotoLink(links, row.url ?? row.photoUrl ?? row.signedUrl, `Photo ${index + 1}`)
      }
    })
  }
  const evidence = ticket.evidence
  if (Array.isArray(evidence)) {
    evidence.forEach((entry, index) => {
      if (typeof entry === 'string') {
        pushPhotoLink(links, entry, `Photo ${index + 1}`)
      } else if (entry && typeof entry === 'object') {
        const row = entry as Record<string, unknown>
        pushPhotoLink(links, row.url ?? row.signedUrl ?? row.downloadUrl ?? row.viewUrl, `Photo ${index + 1}`)
      }
    })
  }
  if (Array.isArray(ticket.evidenceUrls)) {
    ticket.evidenceUrls.forEach((entry, index) => {
      pushPhotoLink(links, entry, `Photo ${index + 1}`)
    })
  }
  return links
}

export function formatHelpProblem(problem: unknown): string {
  if (typeof problem !== 'string' || !problem.trim()) return '—'
  return problem.replace(/_/g, ' ')
}

export function formatHelpReportedItems(
  ticket: Record<string, unknown>,
  orderLineItems?: unknown[],
): string {
  const items = ticket.items
  if (Array.isArray(items) && items.length > 0) {
    return items
      .map((entry, index) => {
        if (typeof entry === 'string') return entry
        if (entry && typeof entry === 'object') {
          const row = entry as Record<string, unknown>
          const name = row.name ?? row.productName ?? row.id ?? `Item ${index + 1}`
          const qty = row.qty != null ? ` × ${row.qty}` : ''
          return `${String(name)}${qty}`
        }
        return `Item ${index + 1}`
      })
      .join(', ')
  }

  const itemIds = ticket.itemIds
  if (Array.isArray(itemIds) && itemIds.length > 0 && Array.isArray(orderLineItems)) {
    const lines = orderLineItems.filter((line) => line && typeof line === 'object') as Array<Record<string, unknown>>
    const labels = itemIds.map((id) => {
      const match = lines.find((line) => line.id === id || line.productId === id)
      if (match) {
        const qty = match.qty != null ? ` × ${match.qty}` : ''
        return `${String(match.name ?? id)}${qty}`
      }
      return String(id)
    })
    return labels.join(', ')
  }

  if (Array.isArray(itemIds) && itemIds.length > 0) {
    return `${itemIds.length} line item(s) reported`
  }

  const resolution = ticket.resolution
  if (resolution && typeof resolution === 'object' && Array.isArray((resolution as Record<string, unknown>).items)) {
    const resItems = (resolution as Record<string, unknown>).items as unknown[]
    if (resItems.length > 0) {
      return formatHelpReportedItems({ items: resItems }, orderLineItems)
    }
  }

  return '—'
}

export interface HelpTimelineRow {
  at: unknown
  type: string
  actor: string
  reason: string
}

export function buildHelpTimeline(
  ticket: Record<string, unknown>,
  orderEvents?: Array<Record<string, unknown>>,
): HelpTimelineRow[] {
  const rows: HelpTimelineRow[] = []
  const history = ticket.history
  if (Array.isArray(history)) {
    history.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return
      const row = entry as Record<string, unknown>
      rows.push({
        at: row.at ?? row.timestamp ?? row.createdAt,
        type: humanizeEventType(row.type ?? row.action ?? 'update'),
        actor: row.actor ? formatActor(row.actor) : String(row.by ?? '—'),
        reason:
          (typeof row.reason === 'string' && row.reason.trim()) ||
          (typeof row.note === 'string' && row.note.trim()) ||
          (typeof row.message === 'string' && row.message.trim()) ||
          '—',
      })
    })
  }

  if (rows.length === 0) {
    rows.push({
      at: ticket.createdAt,
      type: 'Ticket opened',
      actor: 'Customer',
      reason: formatHelpProblem(ticket.problem),
    })
    if (ticket.status === 'reviewing') {
      rows.push({
        at: ticket.updatedAt,
        type: 'Under review',
        actor: ticket.assignedTo ? 'Support' : 'System',
        reason: typeof ticket.supportNote === 'string' && ticket.supportNote.trim() ? ticket.supportNote : '—',
      })
    }
    const resolution = ticket.resolution
    if (resolution && typeof resolution === 'object') {
      const res = resolution as Record<string, unknown>
      const refundPart =
        res.refundAmount != null ? `Refund amount: ${res.refundAmount}` : ''
      rows.push({
        at: res.decidedAt ?? ticket.updatedAt,
        type: `Resolved (${String(res.outcome ?? '—')})`,
        actor: 'Support',
        reason: refundPart || (typeof ticket.supportNote === 'string' ? ticket.supportNote : '—'),
      })
    } else if (ticket.status === 'resolved') {
      rows.push({
        at: ticket.updatedAt,
        type: 'Resolved',
        actor: 'Support',
        reason: typeof ticket.supportNote === 'string' ? ticket.supportNote : '—',
      })
    }
  }

  if (orderEvents) {
    orderEvents
      .filter((ev) => ev.type === 'help_request' || ev.type === 'help_resolved')
      .forEach((ev) => {
        rows.push({
          at: ev.at,
          type: humanizeEventType(ev.type),
          actor: formatActor(ev.actor),
          reason: eventReason(ev),
        })
      })
  }

  rows.sort((a, b) => {
    const ta = parseAdminDate(a.at)?.getTime() ?? 0
    const tb = parseAdminDate(b.at)?.getTime() ?? 0
    return tb - ta
  })

  return rows
}

export function helpCustomerContact(
  ticket: Record<string, unknown>,
  orderCustomer?: { name?: string; phone?: string } | null,
  orderRecord?: Record<string, unknown>,
): { name: string; phone: string } {
  const snapshot =
    (ticket.customerSnapshot && typeof ticket.customerSnapshot === 'object'
      ? ticket.customerSnapshot
      : null) as Record<string, unknown> | null
  const orderSnapshot =
    (orderRecord?.customerSnapshot && typeof orderRecord.customerSnapshot === 'object'
      ? orderRecord.customerSnapshot
      : null) as Record<string, unknown> | null

  const name =
    (typeof ticket.customerName === 'string' && ticket.customerName) ||
    (snapshot && typeof snapshot.name === 'string' && snapshot.name) ||
    orderCustomer?.name ||
    (orderSnapshot && typeof orderSnapshot.name === 'string' && orderSnapshot.name) ||
    '—'

  const phone =
    (typeof ticket.customerPhone === 'string' && ticket.customerPhone) ||
    (snapshot && typeof snapshot.phone === 'string' && snapshot.phone) ||
    orderCustomer?.phone ||
    (orderSnapshot && typeof orderSnapshot.phone === 'string' && orderSnapshot.phone) ||
    '—'

  return { name, phone }
}
