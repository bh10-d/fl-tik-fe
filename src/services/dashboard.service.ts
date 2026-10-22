import { apiClient } from '@/lib/api-client'
import {
  DashboardOverview,
  PublishingTrend,
  ActiveCreator,
  TrackingHealth,
  Video,
} from '@/types'

export interface RecentActivityResponse {
  recentVideos: Array<{
    id: string
    creatorUsername: string
    creatorDisplayName: string
    creatorAvatarUrl: string
    caption: string
    videoUrl: string
    publishedAt: string
    firstSeenAt: string
    views: number | null
    likes: number | null
  }>
  recentImports: Array<{
    id: string
    filename: string
    status: string
    insertedRows: number
    updatedRows: number
    completedAt: string | null
  }>
  recentJobRuns: Array<{
    id: string
    creatorUsername: string
    status: string
    videosDiscovered: number
    startedAt: string
    completedAt: string | null
    error: string | null
  }>
}

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    return apiClient.get<DashboardOverview>('/dashboard/overview')
  },

  async getRecentActivity(): Promise<RecentActivityResponse> {
    return apiClient.get<RecentActivityResponse>('/dashboard/recent-activity')
  },

  async getPublishingTrends(days: number = 7): Promise<PublishingTrend[]> {
    return apiClient.get<PublishingTrend[]>('/dashboard/publishing-trends', {
      params: { days },
    })
  },

  async getMostActiveCreators(
    days: number = 30,
    limit: number = 10
  ): Promise<ActiveCreator[]> {
    return apiClient.get<ActiveCreator[]>('/dashboard/most-active-creators', {
      params: { days, limit },
    })
  },

  async getTrackingHealth(): Promise<TrackingHealth> {
    return apiClient.get<TrackingHealth>('/dashboard/tracking-health')
  },
}

