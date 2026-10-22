import { apiService, ApiRequestError } from './apiService'
import type { ApiResponse } from '../types'
import { mapError } from './errorHandlerService'
import type { ShopDetail, ShopListResponse } from '../types/marketplace'

export interface ShopListParams {
  limit?: number
  offset?: number
  approvalStatus?: string
  nameSearch?: string
  upiVerified?: boolean
}

class ShopAdminService {
  private assertSuccess<T>(response: ApiResponse<T>): T {
    if (response.success) {
      return response.data as T
    }
    throw new ApiRequestError(
      response.error?.code || 'UNKNOWN_ERROR',
      mapError({ code: response.error?.code, message: response.error?.message }),
    )
  }

  async listShops(params: ShopListParams = {}): Promise<ShopListResponse> {
    const response = await apiService.get<ShopListResponse>('/api/admin/shops', {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      approvalStatus: params.approvalStatus || undefined,
      nameSearch: params.nameSearch || undefined,
      upiVerified: params.upiVerified === true ? 'true' : undefined,
    })
    const data = this.assertSuccess(response)
    return {
      shops: data.shops ?? [],
      pagination: data.pagination ?? { limit: 20, offset: 0, total: 0 },
    }
  }

  async getShop(shopId: string): Promise<ShopDetail> {
    const response = await apiService.get<ShopDetail>(`/api/admin/shops/${shopId}`)
    return this.assertSuccess(response)
  }

  async verifyUpi(shopId: string, verifiedName: string): Promise<unknown> {
    const response = await apiService.post<unknown>(`/api/admin/shops/${shopId}/upi-verify`, { verifiedName })
    return this.assertSuccess(response)
  }

  async approve(shopId: string): Promise<unknown> {
    const response = await apiService.post<unknown>(`/api/admin/shops/${shopId}/approve`, {})
    return this.assertSuccess(response)
  }

  async reject(shopId: string, reason: string, sections?: string[]): Promise<unknown> {
    const response = await apiService.post<unknown>(`/api/admin/shops/${shopId}/reject`, { reason, sections })
    return this.assertSuccess(response)
  }

  async suspend(shopId: string, reason: string): Promise<unknown> {
    const response = await apiService.post<unknown>(`/api/admin/shops/${shopId}/suspend`, { reason })
    return this.assertSuccess(response)
  }

  async unsuspend(shopId: string): Promise<unknown> {
    const response = await apiService.post<unknown>(`/api/admin/shops/${shopId}/unsuspend`, {})
    return this.assertSuccess(response)
  }
}

export const shopAdminService = new ShopAdminService()
export default shopAdminService
