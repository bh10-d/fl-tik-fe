export type TrackingStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'ERROR'
  | 'PROVIDER_UNAVAILABLE'
  | 'active'
  | 'paused'
  | 'failed'
  | string

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface InfluencerMetricSnapshot {
  id: string
  influencerId: string
  source: string
  followers: number | null
  likes: number | null
  sales: number | null
  gmv: number | null
  capturedAt: string
}

export interface Influencer {
  id: string
  username: string
  normalizedUsername?: string
  displayName: string
  profileUrl: string
  avatarUrl: string | null
  externalUserId?: string | null
  followers: number | null
  likes?: number | null
  category: string | null
  trackingStatus: TrackingStatus
  source?: string
  createdAt: string
  updatedAt?: string
  lastCheckedAt: string | null
  lastSuccessfulSyncAt?: string | null
  nextScheduledCheckAt?: string | null
  lastSyncError?: string | null
  videoCount?: number
  latestPublishedAt?: string | null
  latestDetectedAt?: string | null
  metricSnapshots?: InfluencerMetricSnapshot[]
  videos?: Video[]
  taggedProducts?: TaggedProduct[]
}

export interface TaggedProduct {
  id: string
  name: string
  externalProductId?: string
  productUrl?: string
  imageUrl?: string
  shopName?: string
  lastTaggedAt?: string
  videoTitle?: string
  videoUrl?: string
}

export interface VideoProduct {
  id: string
  shopId?: string | null
  name: string
  productUrl?: string | null
  imageUrl?: string | null
  shop?: {
    id: string
    name: string
  } | null
}

export interface VideoCreator {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface Video {
  id: string
  provider?: string
  providerVideoId?: string
  creatorId: string
  caption: string | null
  videoUrl: string
  thumbnailUrl: string | null
  publishedAt: string // UTC ISO 8601
  publishedAtSource: string
  publishedAtVerified?: boolean
  firstSeenAt: string // UTC ISO 8601
  lastSeenAt?: string
  durationSeconds?: number | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  shopId: string | null
  productId: string | null
  isNew: boolean
  dataSource: string
  creator?: VideoCreator
  product?: VideoProduct | null
  productAssociations?: Array<{
    id?: string
    evidenceType?: string
    product?: VideoProduct
  }>
  rawMetadata?: Record<string, unknown> | null
}

export interface MetricSnapshot {
  id: string
  videoId: string
  capturedAt: string
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  source?: string
}

export interface Shop {
  id: string
  name: string
  shopUrl: string | null
  externalShopId?: string | null
  market: string | null
  trackingStatus: 'ACTIVE' | 'PAUSED' | 'active' | 'paused' | string
  source?: string
  createdAt?: string
  updatedAt?: string
  lastActivityAt?: string | null
  _count?: {
    products: number
  }
}

export interface Product {
  id: string
  shopId: string | null
  name: string
  productUrl: string | null
  externalProductId?: string | null
  imageUrl: string | null
  createdAt?: string
  updatedAt?: string
  shop?: {
    id: string
    name: string
    market?: string
    shopUrl?: string
  } | null
  _count?: {
    videoAssociations: number
  }
  videoAssociations?: Array<{
    id: string
    videoId: string
    productId: string
    evidenceType: string
    evidenceSource: string
    video?: Video
  }>
}

export interface TrackingJob {
  id: string
  creatorId: string
  creatorUsername: string
  creatorDisplayName: string
  creatorAvatarUrl: string
  lastCheckedAt: string
  latestPublishedAt: string | null
  latestDetectedAt: string | null
  newVideoCount: number
  status: 'completed' | 'running' | 'failed' | 'paused' | 'COMPLETED' | 'RUNNING' | 'FAILED' | 'PAUSED' | string
  nextScheduledAt: string
  failureReason?: string | null
}

export interface DashboardOverview {
  totalCreators: number
  activeTrackedCreators: number
  totalVideosTracked: number
  newVideos24h: number
  totalViews: number
  totalLikes: number
  importedGmv: number
  importedSales: number
  activeJobsCount: number
  timestamp: string
}

export interface PublishingTrend {
  date: string
  publishedCount: number
  detectedCount: number
}

export interface ActiveCreator {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  followers: number | null
  category: string | null
  videoCountInPeriod: number
  totalViewsInPeriod: number
  totalLikesInPeriod: number
}

export interface ProviderCapability {
  supportsCreatorResolution: boolean
  supportsPagination: boolean
  supportsMetrics: boolean
  supportsMetricHistory: boolean
  requiresUserAuthorization: boolean
  rateLimitPerMinute: number
}

export interface ProviderInfo {
  name: string
  isConfigured: boolean
  capabilities: ProviderCapability
}

export interface TrackingHealth {
  period: string
  totalRuns: number
  completedRuns: number
  failedRuns: number
  successRate: number
  providers: ProviderInfo[]
  recentErrors: Array<{
    creatorUsername: string
    errorCode?: string
    errorMessage?: string
    startedAt: string
  }>
}

export interface ImportPreviewItem {
  rowNumber: number
  username: string
  displayName: string
  email: string | null
  followers: number | null
  likes: number | null
  category: string | null
  sales: number | null
  gmv: number | null
  videoViews: number | null
  liveViews: number | null
  isValid: boolean
  validationError?: string
}

export interface ImportPreviewResponse {
  filename: string
  headerRowIndex: number
  detectedHeaders: string[]
  totalRows: number
  validRowCount: number
  invalidRowCount: number
  preview: ImportPreviewItem[]
  errors: string[]
}

export interface ImportExecuteResponse {
  importId: string
  status: string
  totalRows: number
  insertedRows: number
  updatedRows: number
  skippedRows: number
  failedRows: number
  completedAt: string
}

export interface SystemNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert'
  createdAt: string
  read: boolean
}

export interface UserSettings {
  displayTimezone: string
  defaultDateRange: string
  tableDensity: 'compact' | 'normal' | 'comfortable'
  themePreference: 'light' | 'system'
  emailAlerts: boolean
  newVideoNotifications: boolean
  failedJobNotifications: boolean
  autoRefreshInterval: number
}

export interface DataSourceProviderConfig {
  provider: string
  displayName: string
  isEnabled: boolean
  baseUrl?: string | null
  authType?: string
  headerName?: string | null
  maskedApiKey?: string | null
  isConfigured: boolean
  status: string
  lastTestedAt?: string | null
  lastTestStatus?: string | null
  lastTestError?: string | null
  lastSuccessfulRequestAt?: string | null
  lastFailedRequestAt?: string | null
  lastError?: string | null
  metrics: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
  }
  settings?: Record<string, any>
  warningNote?: string
}

export interface ProxyConfiguration {
  id: string
  isEnabled: boolean
  protocol: 'HTTP' | 'HTTPS' | 'SOCKS5'
  host?: string | null
  port?: number | null
  username?: string | null
  maskedPassword?: string | null
  isConfigured: boolean
  region?: string | null
  notes?: string | null
  lastTestedAt?: string | null
  lastTestStatus?: string | null
  lastTestError?: string | null
  ownershipNote: string
}

export interface CollectionPolicyData {
  activeProvider: string
  isCollectionActive: boolean
  pollIntervalMinutes: number
  maxConcurrentJobs: number
  lastCollectionAttemptAt?: string | null
  lastSuccessfulCollectionAt?: string | null
  recentFailureCount: number
  lastError?: string | null
}

export interface DataSourcesResponse {
  providers: {
    internalCrawler: DataSourceProviderConfig
  }
  proxy: ProxyConfiguration
  collectionPolicy: CollectionPolicyData
}

export interface TestConnectionResult {
  provider: string
  success: boolean
  statusCode: number
  latencyMs: number
  message: string
  diagnostics?: Record<string, any>
}

