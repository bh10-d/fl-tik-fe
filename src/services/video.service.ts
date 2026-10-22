import { apiClient } from '@/lib/api-client'
import {
  Video,
  MetricSnapshot,
  PaginatedResponse,
} from '@/types'

export interface QueryVideosParams {
  page?: number
  limit?: number
  creatorId?: string
  username?: string
  search?: string
  publishedAfter?: string
  publishedBefore?: string
  firstSeenAfter?: string
  firstSeenBefore?: string
  shopId?: string
  productId?: string
  isNew?: boolean
  minViews?: number
  maxViews?: number
  minLikes?: number
  provider?: string
  dataSource?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const videoService = {
  async getVideos(params: QueryVideosParams = {}): Promise<PaginatedResponse<Video>> {
    return apiClient.get<PaginatedResponse<Video>>('/videos', {
      params: params as Record<string, string | number | boolean | null | undefined>,
    })
  },

  async getRecentVideos(limit: number = 20): Promise<Video[]> {
    return apiClient.get<Video[]>('/videos/recent', {
      params: { limit },
    })
  },

  async getVideoById(id: string): Promise<Video> {
    return apiClient.get<Video>(`/videos/${id}`)
  },

  async getVideoMetrics(id: string): Promise<MetricSnapshot[]> {
    return apiClient.get<MetricSnapshot[]>(`/videos/${id}/metrics`)
  },

  async getVideosByInfluencer(
    influencerId: string,
    params: QueryVideosParams = {}
  ): Promise<PaginatedResponse<Video>> {
    return apiClient.get<PaginatedResponse<Video>>(`/influencers/${influencerId}/videos`, {
      params: params as Record<string, string | number | boolean | null | undefined>,
    })
  },

  async refreshVideo(id: string): Promise<{ success: boolean; message: string; video: Video }> {
    return apiClient.post<{ success: boolean; message: string; video: Video }>(
      `/videos/${id}/refresh`
    )
  },

  async getVideoComments(
    id: string,
    params: { cursor?: number } = {}
  ): Promise<{
    video_id: string
    total_count: number
    comment_count: number
    comments: Array<{
      id: string
      text: string
      created_at?: string | number
      like_count?: number
      reply_count?: number
      user?: {
        nickname?: string
        username?: string
        profile_picture?: string
      }
    }>
    has_more?: boolean
  }> {
    return apiClient.get(`/videos/${id}/comments`, {
      params: params as Record<string, string | number | boolean | null | undefined>,
    })
  },
}
