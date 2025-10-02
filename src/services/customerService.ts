import { apiService } from './apiService'

interface CustomerServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  message?: string
}

interface Customer {
  id: string
  name?: string
  email?: string
  phone?: string
  personalInfo?: {
    name: string
    email: string
    phone: string
    dateOfBirth?: string
    address?: string
  }
  accountStatus?: 'active' | 'suspended' | 'banned'
  createdAt?: Date
  updatedAt?: Date
  bookingsCount?: number
  // No wallet system for customers
}

class CustomerService {
  // Get all customers
  async getCustomers(): Promise<CustomerServiceResponse<Customer[]>> {
    try {
      console.log('🌐 Fetching customers from backend...')
      const response = await apiService.get('/api/admin/customers')
      
      if (response.success && response.data) {
        console.log('✅ Customers fetched successfully')
        return {
          success: true,
          data: response.data as Customer[],
          message: 'Customers fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'FETCH_CUSTOMERS_ERROR',
          message: response.error?.message || 'Failed to fetch customers'
        }
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_CUSTOMERS_ERROR',
          message: 'Failed to fetch customers'
        }
      }
    }
  }

  // Get single customer
  async getCustomer(customerId: string): Promise<CustomerServiceResponse<Customer>> {
    try {
      console.log(`🌐 Fetching customer: ${customerId}`)
      const response = await apiService.get(`/api/admin/customers/${customerId}`)
      
      if (response.success && response.data) {
        console.log('✅ Customer fetched successfully')
        return {
          success: true,
          data: response.data as Customer,
          message: 'Customer fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'FETCH_CUSTOMER_ERROR',
          message: response.error?.message || 'Failed to fetch customer'
        }
      }
    } catch (error) {
      console.error('❌ Error fetching customer:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_CUSTOMER_ERROR',
          message: 'Failed to fetch customer'
        }
      }
    }
  }

  // Update customer status
  async updateCustomerStatus(customerId: string, status: 'active' | 'suspended', reason?: string): Promise<CustomerServiceResponse> {
    try {
      console.log(`🔄 Updating customer status: ${customerId} to ${status}`)
      const response = await apiService.put(`/api/admin/customers/${customerId}/status`, { status, reason })
      
      if (response.success) {
        console.log('✅ Customer status updated successfully')
        return {
          success: true,
          message: `Customer ${status} successfully`,
          data: response.data
        }
      }
      
      return {
        success: false,
        error: {
          code: 'UPDATE_CUSTOMER_STATUS_ERROR',
          message: response.error?.message || 'Failed to update customer status'
        }
      }
    } catch (error) {
      console.error('❌ Error updating customer status:', error)
      return {
        success: false,
        error: {
          code: 'UPDATE_CUSTOMER_STATUS_ERROR',
          message: 'Failed to update customer status'
        }
      }
    }
  }

  // Ban customer
  async banCustomer(customerId: string, reason?: string): Promise<CustomerServiceResponse> {
    try {
      console.log(`🚫 Banning customer: ${customerId}`)
      const response = await apiService.put(`/api/admin/customers/${customerId}/ban`, { reason })
      
      if (response.success) {
        console.log('✅ Customer banned successfully')
        return {
          success: true,
          message: 'Customer banned successfully',
          data: response.data
        }
      }
      
      return {
        success: false,
        error: {
          code: 'BAN_CUSTOMER_ERROR',
          message: response.error?.message || 'Failed to ban customer'
        }
      }
    } catch (error) {
      console.error('❌ Error banning customer:', error)
      return {
        success: false,
        error: {
          code: 'BAN_CUSTOMER_ERROR',
          message: 'Failed to ban customer'
        }
      }
    }
  }

  // Delete customer
  async deleteCustomer(customerId: string): Promise<CustomerServiceResponse> {
    try {
      console.log(`🗑️ Deleting customer: ${customerId}`)
      const response = await apiService.delete(`/api/admin/customers/${customerId}`)
      
      if (response.success) {
        console.log('✅ Customer deleted successfully')
        return {
          success: true,
          message: 'Customer deleted successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'DELETE_CUSTOMER_ERROR',
          message: response.error?.message || 'Failed to delete customer'
        }
      }
    } catch (error) {
      console.error('❌ Error deleting customer:', error)
      return {
        success: false,
        error: {
          code: 'DELETE_CUSTOMER_ERROR',
          message: 'Failed to delete customer'
        }
      }
    }
  }

  // Get customer bookings
  async getCustomerBookings(customerId: string, status?: string): Promise<CustomerServiceResponse<any[]>> {
    try {
      console.log(`🌐 Fetching customer bookings: ${customerId}`)
      const params = status ? `?status=${status}` : ''
      const response = await apiService.get(`/api/admin/customers/${customerId}/bookings${params}`)
      
      if (response.success && response.data) {
        console.log('✅ Customer bookings fetched successfully')
        return {
          success: true,
          data: response.data as any[],
          message: 'Customer bookings fetched successfully'
        }
      }
      
      return {
        success: false,
        error: {
          code: 'FETCH_CUSTOMER_BOOKINGS_ERROR',
          message: response.error?.message || 'Failed to fetch customer bookings'
        }
      }
    } catch (error) {
      console.error('❌ Error fetching customer bookings:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_CUSTOMER_BOOKINGS_ERROR',
          message: 'Failed to fetch customer bookings'
        }
      }
    }
  }

  // Wallet methods removed - no wallet system for customers
}

export const customerService = new CustomerService()
export default customerService
