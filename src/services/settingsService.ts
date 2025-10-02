import { apiService } from './apiService'
// import { ApiResponse } from '../types' // Removed unused import

interface AdminSettings {
  notifications: boolean
  emailAlerts: boolean
  emergencyAlerts: boolean
  systemAlerts: boolean
  darkMode: boolean
  language: string
  timezone: string
}

interface SystemOperationResponse {
  success: boolean
  message: string
  timestamp: string
}

class SettingsService {
  async getSettings(): Promise<AdminSettings> {
    const response = await apiService.get<AdminSettings>('/api/admin/settings')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.error?.message || 'Failed to fetch settings')
  }

  async updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    const response = await apiService.put<AdminSettings>('/api/admin/settings', settings)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.error?.message || 'Failed to update settings')
  }

  async backupData(): Promise<SystemOperationResponse> {
    const response = await apiService.post<SystemOperationResponse>('/api/admin/system/backup')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.error?.message || 'Failed to backup data')
  }

  async restoreData(backupId: string): Promise<SystemOperationResponse> {
    const response = await apiService.post<SystemOperationResponse>('/api/admin/system/restore', { backupId })
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.error?.message || 'Failed to restore data')
  }

  async clearCache(): Promise<SystemOperationResponse> {
    const response = await apiService.post<SystemOperationResponse>('/api/admin/system/clear-cache')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.error?.message || 'Failed to clear cache')
  }

  async restartSystem(): Promise<SystemOperationResponse> {
    const response = await apiService.post<SystemOperationResponse>('/api/admin/system/restart')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.error?.message || 'Failed to restart system')
  }

  async getSystemInfo(): Promise<any> {
    const response = await apiService.get('/api/admin/system/info')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.error?.message || 'Failed to fetch system info')
  }

  async getBackupList(): Promise<any[]> {
    const response = await apiService.get<any[]>('/api/admin/system/backups')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.error?.message || 'Failed to fetch backup list')
  }
}

export const settingsService = new SettingsService()
export default settingsService
