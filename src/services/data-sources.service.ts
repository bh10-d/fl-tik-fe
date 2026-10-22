import { apiClient } from '@/lib/api-client'
import {
  DataSourcesResponse,
  TestConnectionResult,
} from '@/types'

export interface UpdateCrawlerPayload {
  isEnabled?: boolean
  baseUrl: string
  authType: 'NONE' | 'BEARER' | 'API_KEY' | 'CUSTOM_HEADER'
  headerName?: string
  apiKey?: string
  timeoutMs?: number
  settings?: Record<string, any>
}

export interface UpdateProxyPayload {
  isEnabled: boolean
  protocol: 'HTTP' | 'HTTPS' | 'SOCKS5'
  host?: string
  port?: number
  username?: string
  password?: string
  region?: string
  notes?: string
}

export interface UpdateCollectionPolicyPayload {
  activeProvider?: 'INTERNAL_CRAWLER' | 'MOCK'
  isCollectionActive?: boolean
  pollIntervalMinutes?: number
  maxConcurrentJobs?: number
}

export const dataSourcesService = {
  async getAll(): Promise<DataSourcesResponse> {
    return apiClient.get<DataSourcesResponse>('/data-sources')
  },

  async getStatus() {
    return apiClient.get<any>('/data-sources/status')
  },

  async updateCrawlerConfig(payload: UpdateCrawlerPayload): Promise<DataSourcesResponse> {
    return apiClient.put<DataSourcesResponse>('/data-sources/crawler/config', payload)
  },

  async updateProxyConfig(payload: UpdateProxyPayload): Promise<DataSourcesResponse> {
    return apiClient.put<DataSourcesResponse>('/data-sources/proxy/config', payload)
  },

  async updateCollectionPolicy(
    payload: UpdateCollectionPolicyPayload
  ): Promise<DataSourcesResponse> {
    return apiClient.put<DataSourcesResponse>('/data-sources/collection-policy', payload)
  },

  async stopCollection(reason?: string): Promise<DataSourcesResponse> {
    return apiClient.post<DataSourcesResponse>('/data-sources/collection/stop', { reason })
  },

  async startCollection(): Promise<DataSourcesResponse> {
    return apiClient.post<DataSourcesResponse>('/data-sources/collection/start', {})
  },

  async testConnection(provider: string): Promise<TestConnectionResult> {
    return apiClient.post<TestConnectionResult>(
      `/data-sources/${encodeURIComponent(provider)}/test-connection`,
      {}
    )
  },
}

