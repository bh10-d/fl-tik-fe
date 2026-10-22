import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import {
  SystemNotification,
  UserSettings,
} from '@/types'
import { dashboardService } from '@/services/dashboard.service'
import { apiClient } from '@/lib/api-client'

interface BackendHealthState {
  healthy: boolean
  database: string
  redis: string
  uptime?: number
  timestamp?: string
  activeProvider: string
  error?: string
}

interface AppContextType {
  backendHealth: BackendHealthState | null
  isCheckingHealth: boolean
  checkHealth: () => Promise<void>
  notifications: SystemNotification[]
  unreadNotificationsCount: number
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  settings: UserSettings
  updateSettings: (newSettings: Partial<UserSettings>) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  dateRange: string
  setDateRange: (range: string) => void
  refreshKey: number
  triggerRefresh: () => void
}

const defaultSettings: UserSettings = {
  displayTimezone: 'Asia/Ho_Chi_Minh',
  defaultDateRange: '7d',
  tableDensity: 'compact',
  themePreference: 'light',
  emailAlerts: true,
  newVideoNotifications: true,
  failedJobNotifications: true,
  autoRefreshInterval: 30,
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [backendHealth, setBackendHealth] = useState<BackendHealthState | null>(null)
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(true)
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [refreshKey, setRefreshKey] = useState<number>(0)

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('influencer_monitor_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Migrate legacy 'UTC' default to 'Asia/Ho_Chi_Minh'
        if (parsed.displayTimezone === 'UTC') {
          parsed.displayTimezone = 'Asia/Ho_Chi_Minh'
          try {
            localStorage.setItem('influencer_monitor_settings', JSON.stringify({ ...defaultSettings, ...parsed }))
          } catch {
            // ignore
          }
        }
        return { ...defaultSettings, ...parsed }
      }
      return defaultSettings
    } catch {
      return defaultSettings
    }
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState(settings.defaultDateRange || '7d')

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      try {
        localStorage.setItem('influencer_monitor_settings', JSON.stringify(updated))
      } catch {
        // Storage failover
      }
      return updated
    })
  }

  // Health check and provider resolution
  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true)
    try {
      const healthData = await apiClient.get<{
        status: string
        timestamp: string
        uptime: number
        components: { database: { status: string }; redis: { status: string } }
      }>('/health', { timeoutMs: 5000 })

      let providerName = 'MOCK'
      try {
        const trackingHealth = await dashboardService.getTrackingHealth()
        const active = trackingHealth.providers.find((p) => p.isConfigured)
        if (active) providerName = active.name
      } catch {
        // Fall back to MOCK
      }

      setBackendHealth({
        healthy: healthData.status === 'healthy',
        database: healthData.components?.database?.status || 'up',
        redis: healthData.components?.redis?.status || 'up',
        uptime: healthData.uptime,
        timestamp: healthData.timestamp,
        activeProvider: providerName,
      })
    } catch (err: unknown) {
      setBackendHealth({
        healthy: false,
        database: 'down',
        redis: 'down',
        activeProvider: 'UNAVAILABLE',
        error: err instanceof Error ? err.message : 'Backend unreachable',
      })
    } finally {
      setIsCheckingHealth(false)
    }
  }, [])

  // Poll recent activity to populate real notifications
  const loadNotifications = useCallback(async () => {
    try {
      const activity = await dashboardService.getRecentActivity()
      const newNotifs: SystemNotification[] = []

      // Add recent video discoveries
      activity.recentVideos.slice(0, 3).forEach((v) => {
        newNotifs.push({
          id: `notif-vid-${v.id}`,
          title: 'New Video Discovered',
          message: `@${v.creatorUsername} published: "${v.caption ? v.caption.slice(0, 60) + '...' : 'New promotional video'}"`,
          type: 'success',
          createdAt: v.firstSeenAt,
          read: false,
        })
      })

      // Add recent job failures or successes
      activity.recentJobRuns.slice(0, 2).forEach((job) => {
        if (job.status === 'FAILED') {
          newNotifs.push({
            id: `notif-job-${job.id}`,
            title: 'Crawler Worker Alert',
            message: `Sync job for @${job.creatorUsername} failed: ${job.error || 'Provider rate limit'}`,
            type: 'warning',
            createdAt: job.startedAt,
            read: false,
          })
        }
      })

      if (newNotifs.length > 0) {
        setNotifications((prev) => {
          const prevMap = new Map(prev.map((n) => [n.id, n.read]))
          return newNotifs.map((n) => ({
            ...n,
            read: prevMap.has(n.id) ? Boolean(prevMap.get(n.id)) : n.read,
          }))
        })
      }
    } catch {
      // Ignore background notification load errors
    }
  }, [])

  useEffect(() => {
    checkHealth()
    loadNotifications()
    const timer = setInterval(() => {
      checkHealth()
      loadNotifications()
    }, 60000)
    return () => clearInterval(timer)
  }, [checkHealth, loadNotifications])

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length

  const contextValue = useMemo(
    () => ({
      backendHealth,
      isCheckingHealth,
      checkHealth,
      notifications,
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      settings,
      updateSettings,
      searchQuery,
      setSearchQuery,
      dateRange,
      setDateRange,
      refreshKey,
      triggerRefresh,
    }),
    [
      backendHealth,
      isCheckingHealth,
      checkHealth,
      notifications,
      unreadNotificationsCount,
      settings,
      searchQuery,
      dateRange,
      refreshKey,
      triggerRefresh,
    ]
  )

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
