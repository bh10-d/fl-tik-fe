import { apiClient } from '@/lib/api-client'

export interface TopAdItem {
  id: string
  link: string
  caption?: string
  brand_name?: string | null
  objective?: string
  industry_key?: string
  ctr?: number
  cost?: number
  like_count?: number
  video?: {
    id?: string
    duration_seconds?: number
    cover?: string
    play_links?: Array<{ quality: string; link: string }>
  }
}

export interface TopAdsResponse {
  country: string
  period_days: number
  sort: string
  total_count: number
  ad_count: number
  ads: TopAdItem[]
}

export interface TrendingVideoItem {
  id: string
  link: string
  description?: string
  cover?: string
  created_at?: string
  stats?: {
    play_count?: number
    like_count?: number
    comment_count?: number
    share_count?: number
    save_count?: number
  }
  author?: {
    id?: string
    username?: string
    nickname?: string
    profile_picture?: string
  }
  music?: {
    title?: string
    author_name?: string
  }
  hashtags?: Array<{ name: string }>
}

export interface TrendingFeedResponse {
  country: string
  video_count: number
  videos: TrendingVideoItem[]
}

export interface HashtagDetailsResponse {
  id: string
  name: string
  link: string
  description?: string
  video_count?: number
  view_count?: number
  cover?: string
  profile_picture?: string
}

export interface SearchSuggestionsResponse {
  query: string
  suggestion_count: number
  suggestions: string[]
}

export const intelligenceService = {
  /**
   * 1. Top Winning Ads US from TikTok Creative Center
   */
  async getTopAds(params: { country?: string; period?: number; sort?: string } = {}): Promise<TopAdsResponse> {
    return apiClient.get<TopAdsResponse>('/intelligence/ads/top', {
      params: params as Record<string, string | number | boolean | null | undefined>,
    })
  },

  /**
   * 3. Live Trending US Feed
   */
  async getTrendingFeed(params: { country?: string } = {}): Promise<TrendingFeedResponse> {
    return apiClient.get<TrendingFeedResponse>('/intelligence/trending', {
      params: params as Record<string, string | number | boolean | null | undefined>,
    })
  },

  /**
   * 4. Hashtag details & top videos
   */
  async getHashtagDetails(hashtag: string): Promise<HashtagDetailsResponse> {
    const clean = hashtag.replace(/^#/, '').trim()
    return apiClient.get<HashtagDetailsResponse>(`/intelligence/hashtags/${encodeURIComponent(clean)}`)
  },

  async getHashtagVideos(hashtag: string, cursor?: string): Promise<{ hashtag: string; video_count: number; videos: TrendingVideoItem[] }> {
    const clean = hashtag.replace(/^#/, '').trim()
    return apiClient.get(`/intelligence/hashtags/${encodeURIComponent(clean)}/videos`, {
      params: cursor ? { cursor } : undefined,
    })
  },

  /**
   * 5. Search auto-suggestions
   */
  async getSearchSuggestions(query: string, country = 'US'): Promise<SearchSuggestionsResponse> {
    if (!query || !query.trim()) {
      return { query: '', suggestion_count: 0, suggestions: [] }
    }
    return apiClient.get<SearchSuggestionsResponse>('/intelligence/search/suggestions', {
      params: { query: query.trim(), country },
    })
  },
}

