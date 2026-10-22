import { apiClient } from '@/lib/api-client'
import {
  Influencer,
  PaginatedResponse,
} from '@/types'

export interface QueryInfluencersParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  trackingStatus?: string
  lastVideoFilter?: string
  minFollowers?: number
  maxFollowers?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface DormantInfluencerItem {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  category: string | null
  followers: number | null
  trackingStatus: string
  latestPublishedAt: string | null
}

export interface DormantSummary {
  thresholdDays: number
  cutOffDate: string
  dormantCount: number
  noVideosCount: number
  totalInactive: number
  dormantInfluencers: DormantInfluencerItem[]
}

export interface CreateInfluencerPayload {
  username: string
  displayName?: string
  avatarUrl?: string
  category?: string
  followers?: number
  profileUrl?: string
}

export interface UpdateInfluencerPayload {
  username?: string
  displayName?: string
  avatarUrl?: string
  category?: string
  followers?: number
  profileUrl?: string
  trackingStatus?: string
}

export const influencerService = {
  async getInfluencers(
    params: QueryInfluencersParams = {}
  ): Promise<PaginatedResponse<Influencer>> {
    return apiClient.get<PaginatedResponse<Influencer>>('/influencers', {
      params: params as Record<string, string | number | boolean | null | undefined>,
    })
  },

  async getInfluencerById(id: string): Promise<Influencer> {
    return apiClient.get<Influencer>(`/influencers/${id}`)
  },

  async createInfluencer(payload: CreateInfluencerPayload): Promise<Influencer> {
    return apiClient.post<Influencer>('/influencers', payload)
  },

  async updateInfluencer(
    id: string,
    payload: UpdateInfluencerPayload
  ): Promise<Influencer> {
    return apiClient.patch<Influencer>(`/influencers/${id}`, payload)
  },

  async deleteInfluencer(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/influencers/${id}`)
  },

  async trackInfluencer(id: string): Promise<Influencer> {
    return apiClient.post<Influencer>(`/influencers/${id}/track`)
  },

  async pauseInfluencer(id: string): Promise<Influencer> {
    return apiClient.post<Influencer>(`/influencers/${id}/pause`)
  },

  async syncInfluencer(id: string): Promise<{ jobId?: string; message: string; status: string }> {
    return apiClient.post<{ jobId?: string; message: string; status: string }>(
      `/influencers/${id}/sync`
    )
  },

  async bulkTrack(ids: string[]): Promise<{ count: number; message: string }> {
    return apiClient.post<{ count: number; message: string }>('/influencers/bulk-track', {
      ids,
    })
  },

  async bulkPause(ids: string[]): Promise<{ count: number; message: string }> {
    return apiClient.post<{ count: number; message: string }>('/influencers/bulk-pause', {
      ids,
    })
  },

  async bulkDelete(ids: string[]): Promise<{ count: number; message: string }> {
    return apiClient.post<{ count: number; message: string }>('/influencers/bulk-delete', {
      ids,
    })
  },

  async getDormantSummary(days = 180): Promise<DormantSummary> {
    return apiClient.get<DormantSummary>('/influencers/dormant-summary', {
      params: { days },
    })
  },
}

