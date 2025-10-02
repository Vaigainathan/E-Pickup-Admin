import { apiService } from './apiService'
import { SupportTicket, PaginationParams, FilterParams } from '../types'

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
  async getSupportTickets(
    pagination: PaginationParams,
    // filters: FilterParams = {} // Removed unused parameter
  ): Promise<SupportTicketsResponse> {
    try {
      // Get real data from backend API
      const response = await apiService.get('/admin/support-tickets', {
        params: {
          page: pagination.page,
          limit: pagination.limit
        }
      })
      
      if (response.success && response.data) {
        const data = response.data as any
        return {
          tickets: data.tickets || [],
          pagination: data.pagination || {
            page: pagination.page,
            limit: pagination.limit,
            total: 0,
            totalPages: 0
          }
        }
      }
      
      // Fallback to mock data if API fails
      const mockTickets: any[] = [
      {
        id: 'ticket-1',
        ticketId: 'TKT-001',
        userId: 'customer-1',
        userType: 'customer',
        userInfo: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '+1234567890'
        },
        subject: 'Payment Issue',
        description: 'I was charged twice for my ride yesterday. Please help me get a refund.',
        category: 'billing',
        priority: 'high',
        status: 'open',
        assignedTo: null,
        messages: [
          {
            id: 'msg-1',
            senderId: 'customer-1',
            senderType: 'user',
            senderName: 'Alice Johnson',
            message: 'I was charged twice for my ride yesterday. Please help me get a refund.',
            timestamp: '2024-01-15T10:00:00Z'
          }
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'ticket-2',
        ticketId: 'TKT-002',
        userId: 'customer-2',
        userType: 'customer',
        userInfo: {
          name: 'Bob Smith',
          email: 'bob@example.com',
          phone: '+1234567891'
        },
        subject: 'Driver Rating Issue',
        description: 'I want to change my rating for my last ride. The driver was excellent.',
        category: 'general',
        priority: 'low',
        status: 'resolved',
        assignedTo: 'admin-1',
        messages: [
          {
            id: 'msg-2',
            senderId: 'customer-2',
            senderType: 'user',
            senderName: 'Bob Smith',
            message: 'I want to change my rating for my last ride. The driver was excellent.',
            timestamp: '2024-01-15T09:30:00Z'
          },
          {
            id: 'msg-3',
            senderId: 'admin-1',
            senderType: 'admin',
            senderName: 'Admin User',
            message: 'Thank you for your feedback. I have updated your rating to 5 stars.',
            timestamp: '2024-01-15T09:45:00Z'
          }
        ],
        createdAt: '2024-01-15T09:30:00Z',
        updatedAt: '2024-01-15T09:45:00Z'
      }
    ]

    return {
      tickets: mockTickets,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: mockTickets.length,
        totalPages: Math.ceil(mockTickets.length / pagination.limit)
      }
    }
    } catch (error) {
      console.error('Failed to fetch support tickets:', error)
      // Return mock data on error
      const mockTickets: any[] = [
        {
          id: 'ticket-1',
          ticketId: 'TKT-001',
          userId: 'customer-1',
          userType: 'customer',
          userInfo: {
            name: 'Alice Johnson',
            email: 'alice@example.com',
            phone: '+1234567890'
          },
          subject: 'Payment Issue',
          description: 'I was charged twice for my ride yesterday. Please help me get a refund.',
          category: 'billing',
          priority: 'high',
          status: 'open',
          assignedTo: null,
          messages: [
            {
              id: 'msg-1',
              senderId: 'customer-1',
              senderType: 'user',
              senderName: 'Alice Johnson',
              message: 'I was charged twice for my ride yesterday. Please help me get a refund.',
              timestamp: '2024-01-15T10:00:00Z'
            }
          ],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        }
      ]

      return {
        tickets: mockTickets,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: mockTickets.length,
          totalPages: Math.ceil(mockTickets.length / pagination.limit)
        }
      }
    }
  }

  async getTicketById(ticketId: string): Promise<SupportTicket> {
    const response = await apiService.get<SupportTicket>(`/admin/support/tickets/${ticketId}`)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch support ticket')
  }

  async updateTicketStatus(ticketId: string, status: string): Promise<{ status: string; message: string }> {
    const response = await apiService.put(`/admin/support/tickets/${ticketId}`, { status })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to update ticket status')
  }

  async assignTicket(ticketId: string, assignedTo: string): Promise<{ assignedTo: string; message: string }> {
    const response = await apiService.put(`/admin/support/tickets/${ticketId}/assign`, { assignedTo })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to assign ticket')
  }

  async sendMessage(
    ticketId: string,
    message: string,
    attachments?: string[]
  ): Promise<{ message: any }> {
    const response = await apiService.post(`/admin/support/tickets/${ticketId}/message`, {
      message,
      attachments,
    })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to send message')
  }

  async getSupportStats(): Promise<any> {
    const response = await apiService.get('/api/admin/support/analytics')
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch support stats')
  }

  async sendBroadcastMessage(message: string, targetUsers?: string[]): Promise<{ message: string }> {
    const response = await apiService.post('/api/admin/support/broadcast', {
      message,
      targetUsers,
    })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to send broadcast message')
  }

  async closeTicket(ticketId: string, resolution: string): Promise<{ message: string }> {
    const response = await apiService.put(`/admin/support/tickets/${ticketId}/close`, { resolution })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to close ticket')
  }

  async reopenTicket(ticketId: string, reason: string): Promise<{ message: string }> {
    const response = await apiService.put(`/admin/support/tickets/${ticketId}/reopen`, { reason })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to reopen ticket')
  }

  async escalateTicket(ticketId: string, reason: string): Promise<{ message: string }> {
    const response = await apiService.post(`/admin/support/tickets/${ticketId}/escalate`, { reason })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to escalate ticket')
  }

  async addTicketNote(ticketId: string, note: string, isInternal: boolean = true): Promise<{ message: string }> {
    const response = await apiService.post(`/admin/support/tickets/${ticketId}/note`, {
      note,
      isInternal,
    })
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to add ticket note')
  }

  async getTicketHistory(ticketId: string): Promise<any[]> {
    const response = await apiService.get(`/admin/support/tickets/${ticketId}/history`)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch ticket history')
  }

  async getSupportReports(
    startDate: string,
    endDate: string,
    filters?: FilterParams
  ): Promise<any> {
    const params = {
      startDate,
      endDate,
      ...filters,
    }
    const response = await apiService.get('/api/admin/support/reports', params)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch support reports')
  }

  async getAvailableAgents(): Promise<any[]> {
    const response = await apiService.get('/api/admin/support/agents')
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch available agents')
  }

  async createTicketTemplate(template: any): Promise<{ message: string }> {
    const response = await apiService.post('/api/admin/support/templates', template)
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to create ticket template')
  }

  async getTicketTemplates(): Promise<any[]> {
    const response = await apiService.get('/api/admin/support/templates')
    if (response.success && response.data) {
      return response.data as any
    }
    throw new Error(response.error?.message || 'Failed to fetch ticket templates')
  }
}

export const supportService = new SupportService()
export default supportService
