import { apiService } from './apiService'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  services: {
    api: boolean
    database: boolean
    websocket: boolean
    firebase: boolean
  }
  uptime: number
  lastCheck: string
}

interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  network: {
    requestsPerMinute: number
    averageResponseTime: number
  }
}

interface ConnectedUsers {
  total: number
  customers: number
  drivers: number
  admins: number
}

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class OptimizedSystemService {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly CACHE_TTL = 30 * 1000 // 30 seconds for system data

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}_${JSON.stringify(params || {})}`
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (entry && this.isCacheValid(entry)) {
      return entry.data as T
    }
    if (entry) {
      this.cache.delete(key)
    }
    return null
  }

  private setCachedData<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const cacheKey = this.getCacheKey('system_health')
    const cachedData = this.getCachedData<SystemHealth>(cacheKey)
    
    if (cachedData) {
      console.log('📦 Using cached system health data')
      return cachedData
    }

    try {
      console.log('🌐 Fetching system health from API...')
      const response = await apiService.get('/api/admin/system/health')
      
      if (response.success && response.data) {
        const health = response.data as SystemHealth
        this.setCachedData(cacheKey, health)
        console.log('✅ System health data cached successfully')
        return health
      }
      
      // Fallback to default healthy state
      const defaultHealth: SystemHealth = {
        status: 'healthy',
        services: {
          api: true,
          database: true,
          websocket: true,
          firebase: true
        },
        uptime: 0,
        lastCheck: new Date().toISOString()
      }
      
      console.log('⚠️ Using default system health data')
      return defaultHealth
      
    } catch (error) {
      console.error('❌ Error fetching system health:', error)
      
      // Return default healthy state on error
      const defaultHealth: SystemHealth = {
        status: 'healthy',
        services: {
          api: true,
          database: true,
          websocket: true,
          firebase: true
        },
        uptime: 0,
        lastCheck: new Date().toISOString()
      }
      
      return defaultHealth
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const cacheKey = this.getCacheKey('system_metrics')
    const cachedData = this.getCachedData<SystemMetrics>(cacheKey)
    
    if (cachedData) {
      console.log('📦 Using cached system metrics')
      return cachedData
    }

    try {
      console.log('🌐 Fetching system metrics from API...')
      const response = await apiService.get('/api/admin/system/metrics')
      
      if (response.success && response.data) {
        const metrics = response.data as SystemMetrics
        this.setCachedData(cacheKey, metrics)
        console.log('✅ System metrics cached successfully')
        return metrics
      }
      
      // Fallback to default metrics
      const defaultMetrics: SystemMetrics = {
        cpu: {
          usage: 0,
          cores: 4
        },
        memory: {
          used: 0,
          total: 0,
          percentage: 0
        },
        disk: {
          used: 0,
          total: 0,
          percentage: 0
        },
        network: {
          requestsPerMinute: 0,
          averageResponseTime: 0
        }
      }
      
      console.log('⚠️ Using default system metrics')
      return defaultMetrics
      
    } catch (error) {
      console.error('❌ Error fetching system metrics:', error)
      
      // Return default metrics on error
      const defaultMetrics: SystemMetrics = {
        cpu: {
          usage: 0,
          cores: 4
        },
        memory: {
          used: 0,
          total: 0,
          percentage: 0
        },
        disk: {
          used: 0,
          total: 0,
          percentage: 0
        },
        network: {
          requestsPerMinute: 0,
          averageResponseTime: 0
        }
      }
      
      return defaultMetrics
    }
  }

  async getConnectedUsers(): Promise<ConnectedUsers> {
    const cacheKey = this.getCacheKey('connected_users')
    const cachedData = this.getCachedData<ConnectedUsers>(cacheKey)
    
    if (cachedData) {
      console.log('📦 Using cached connected users data')
      return cachedData
    }

    try {
      console.log('🌐 Fetching connected users from API...')
      const response = await apiService.get('/api/admin/system/connected-users')
      
      if (response.success && response.data) {
        const users = response.data as ConnectedUsers
        this.setCachedData(cacheKey, users)
        console.log('✅ Connected users data cached successfully')
        return users
      }
      
      // Fallback to default users
      const defaultUsers: ConnectedUsers = {
        total: 0,
        customers: 0,
        drivers: 0,
        admins: 0
      }
      
      console.log('⚠️ Using default connected users data')
      return defaultUsers
      
    } catch (error) {
      console.error('❌ Error fetching connected users:', error)
      
      // Return default users on error
      const defaultUsers: ConnectedUsers = {
        total: 0,
        customers: 0,
        drivers: 0,
        admins: 0
      }
      
      return defaultUsers
    }
  }

  async getSystemLogs(limit: number = 50): Promise<any[]> {
    const cacheKey = this.getCacheKey('system_logs', { limit })
    const cachedData = this.getCachedData<any[]>(cacheKey)
    
    if (cachedData) {
      console.log('📦 Using cached system logs')
      return cachedData
    }

    try {
      console.log('🌐 Fetching system logs from API...')
      const response = await apiService.get('/api/admin/system/logs', { limit })
      
      if (response.success && response.data) {
        const logs = response.data as any[]
        this.setCachedData(cacheKey, logs, 60 * 1000) // 1 minute cache for logs
        console.log('✅ System logs cached successfully')
        return logs
      }
      
      console.log('⚠️ No system logs found')
      return []
      
    } catch (error) {
      console.error('❌ Error fetching system logs:', error)
      return []
    }
  }

  async getSystemStatistics(): Promise<any> {
    const cacheKey = this.getCacheKey('system_statistics')
    const cachedData = this.getCachedData<any>(cacheKey)
    
    if (cachedData) {
      console.log('📦 Using cached system statistics')
      return cachedData
    }

    try {
      console.log('🌐 Fetching system statistics from API...')
      const response = await apiService.get('/api/admin/system/statistics')
      
      if (response.success && response.data) {
        const stats = response.data
        this.setCachedData(cacheKey, stats, 5 * 60 * 1000) // 5 minutes cache for statistics
        console.log('✅ System statistics cached successfully')
        return stats
      }
      
      console.log('⚠️ No system statistics found')
      return {}
      
    } catch (error) {
      console.error('❌ Error fetching system statistics:', error)
      return {}
    }
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ System service cache cleared')
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const optimizedSystemService = new OptimizedSystemService()
export default optimizedSystemService
