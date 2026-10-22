import { apiService, ApiRequestError } from './apiService'
import type { ApiResponse } from '../types'
import { mapError } from './errorHandlerService'
import type {
  MarketplaceEnforcement,
  MarketplaceHelpTicket,
  MarketplaceOrderDetail,
  MarketplaceOrderSummary,
} from '../types/marketplace'

export interface MarketplaceOrdersList {
  orders: MarketplaceOrderSummary[]
  pagination: { limit: number; offset: number; count: number }
}

export interface MarketplaceHelpTicketsList {
  tickets: MarketplaceHelpTicket[]
  pagination: { limit: number; offset: number; count: number }
}

class MarketplaceAdminService {
  private assertSuccess<T>(response: ApiResponse<T>): T {
    if (response.success) {
      return response.data as T
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code, message: response.error?.message }),
    )
  }

  async getEnforcement(): Promise<MarketplaceEnforcement> {
    const response = await apiService.get<MarketplaceEnforcement>('/api/admin/marketplace/enforcement')
    return this.assertSuccess(response)
  }

  async listOrders(params: { limit?: number; offset?: number; status?: string } = {}): Promise<MarketplaceOrdersList> {
    const response = await apiService.get<MarketplaceOrdersList>('/api/admin/marketplace/orders', {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      status: params.status || undefined,
    })
    const data = this.assertSuccess(response)
    return {
      orders: data.orders ?? [],
      pagination: data.pagination ?? { limit: 20, offset: 0, count: 0 },
    }
  }

  async getOrder(orderId: string): Promise<MarketplaceOrderDetail> {
    const response = await apiService.get<MarketplaceOrderDetail>(`/api/admin/marketplace/orders/${orderId}`)
    return this.assertSuccess(response)
  }

  async cancelOrder(orderId: string, reason?: string): Promise<unknown> {
    const response = await apiService.post<unknown>(`/api/admin/marketplace/orders/${orderId}/cancel`, { reason })
    return this.assertSuccess(response)
  }

  async resolvePaymentReview(
    orderId: string,
    body: { outcome: 'found' | 'not_found' | 'refund'; reason: string },
  ): Promise<unknown> {
    const response = await apiService.post<unknown>(
      `/api/admin/marketplace/orders/${orderId}/payment-review/resolve`,
      body,
    )
    return this.assertSuccess(response)
  }

  async resolvePaidCheck(
    orderId: string,
    body: { outcome: 'received' | 'not_received'; operator: string; body?: Record<string, unknown> },
  ): Promise<unknown> {
    const response = await apiService.post<unknown>(`/api/admin/marketplace/orders/${orderId}/paid-check/resolve`, body)
    return this.assertSuccess(response)
  }

  async recordRefundSent(
    orderId: string,
    refundId: string,
    body: { refundUtr: string; amount: number; reason?: string },
  ): Promise<unknown> {
    const response = await apiService.post<unknown>(
      `/api/admin/marketplace/orders/${orderId}/refunds/${refundId}/sent`,
      body,
    )
    return this.assertSuccess(response)
  }

  async resolveRefundDispute(
    orderId: string,
    refundId: string,
    body: { outcome: 'received' | 'resend'; to?: 'due' | 'upi_needed' },
  ): Promise<unknown> {
    const response = await apiService.post<unknown>(
      `/api/admin/marketplace/orders/${orderId}/refunds/${refundId}/dispute/resolve`,
      body,
    )
    return this.assertSuccess(response)
  }

  async listHelpTickets(params: { limit?: number; offset?: number; status?: string } = {}): Promise<MarketplaceHelpTicketsList> {
    const response = await apiService.get<MarketplaceHelpTicketsList>('/api/admin/marketplace/help/tickets', {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      status: params.status || undefined,
    })
    const data = this.assertSuccess(response)
    return {
      tickets: data.tickets ?? [],
      pagination: data.pagination ?? { limit: 20, offset: 0, count: 0 },
    }
  }

  async getHelpTicket(ticketId: string): Promise<MarketplaceHelpTicket> {
    const response = await apiService.get<MarketplaceHelpTicket>(`/api/admin/marketplace/help/tickets/${ticketId}`)
    return this.assertSuccess(response)
  }

  async resolveHelpTicket(
    ticketId: string,
    body: {
      status: 'reviewing' | 'resolved'
      outcome?: 'no_action' | 'refund'
      amount?: number
      supportNote?: string
    },
  ): Promise<unknown> {
    const response = await apiService.post<unknown>(`/api/admin/marketplace/help/tickets/${ticketId}/resolve`, body)
    return this.assertSuccess(response)
  }

  async restrictCustomer(customerId: string, reason: string, force?: boolean): Promise<unknown> {
    const response = await apiService.post<unknown>(`/api/admin/marketplace/customers/${customerId}/restrict`, {
      reason,
      force: force === true,
    })
    return this.assertSuccess(response)
  }

  async unrestrictCustomer(customerId: string): Promise<unknown> {
    const response = await apiService.post<unknown>(`/api/admin/marketplace/customers/${customerId}/unrestrict`, {})
    return this.assertSuccess(response)
  }
}

export const marketplaceAdminService = new MarketplaceAdminService()
export default marketplaceAdminService
