import { apiService } from './apiService'
import { SupportTicket, PaginationParams } from '../types'
import { mapError } from './errorHandlerService'
import { ApiRequestError } from './apiService'

interface SupportTicketsResponse {
  tickets: SupportTicket[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class SupportService {
  async getSupportTickets(pagination: PaginationParams): Promise<SupportTicketsResponse> {
    const response = await apiService.get('/api/admin/support/tickets', {
      page: pagination.page,
      limit: pagination.limit,
    })

    if (response.success) {
      const data = response.data as any
      let tickets: SupportTicket[] = []
      if (Array.isArray(data)) {
        tickets = data
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.tickets)) tickets = data.tickets
        else if (Array.isArray(data.data)) tickets = data.data
        else if (Array.isArray(data.items)) tickets = data.items
      }
      const limit = pagination.limit || 10
      const page = pagination.page || 1
      const paginationMeta = data?.pagination
      return {
        tickets,
        pagination: paginationMeta
          ? {
              page: paginationMeta.page ?? page,
              limit: paginationMeta.limit ?? limit,
              total: paginationMeta.total ?? tickets.length,
              totalPages:
                paginationMeta.totalPages ??
                Math.max(1, Math.ceil((paginationMeta.total ?? tickets.length) / limit)),
            }
          : {
              page,
              limit,
              total: tickets.length,
              totalPages: Math.max(1, Math.ceil(tickets.length / limit)),
            },
      }
    }

    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async replyToTicket(ticketId: string, message: string): Promise<void> {
    const response = await apiService.post(`/api/admin/support/tickets/${ticketId}/reply`, { message })
    if (response.success) return
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async updateTicketStatus(
    ticketId: string,
    status: string,
    adminNotes?: string,
  ): Promise<void> {
    const response = await apiService.put(`/api/admin/support/tickets/${ticketId}/status`, {
      status,
      adminNotes,
    })
    if (response.success) return
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async resolveTicket(ticketId: string, resolution: string): Promise<{ message: string }> {
    const response = await apiService.post(`/api/admin/support/tickets/${ticketId}/resolve`, {
      resolution,
    })
    if (response.success) {
      return { message: 'Ticket resolved successfully' }
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }

  async getSupportAnalytics(): Promise<any> {
    const response = await apiService.get('/api/admin/analytics/support')
    if (response.success && response.data) return response.data
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code }),
    )
  }
}

export const supportService = new SupportService()
export default supportService
