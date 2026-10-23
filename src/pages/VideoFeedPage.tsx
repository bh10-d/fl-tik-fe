import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutGrid,
  List,
  Search,
  ExternalLink,
  Eye,
  Heart,
  ShoppingBag,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  Trophy,
  Flame,
  Hash,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApp } from '@/context/AppContext'
import { useDebounce } from '@/hooks/useDebounce'
import { Video, Influencer, Shop, PaginationMeta } from '@/types'
import { SearchableSelect, SearchableOption } from '@/components/common/SearchableSelect'
import { SearchWithSuggestions } from '@/components/common/SearchWithSuggestions'
import { LazyImage } from '@/components/common/LazyImage'
import { WinningAdsSection } from '@/components/intelligence/WinningAdsSection'
import { TrendingFeedSection } from '@/components/intelligence/TrendingFeedSection'
import { HashtagExplorerSection } from '@/components/intelligence/HashtagExplorerSection'
import { videoService, QueryVideosParams } from '@/services/video.service'
import { influencerService } from '@/services/influencer.service'
import { shopService } from '@/services/shop.service'
import {
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatTimeAgo,
} from '@/utils/formatters'
import { VideoDetailSheet } from '@/components/videos/VideoDetailSheet'
import { DataTablePagination } from '@/components/common/DataTablePagination'

const VideoGridCard = React.memo(function VideoGridCard({
  video,
  displayTimezone,
  onOpenDetails,
  isCopied,
  onCopyLink,
}: {
  video: Video
  displayTimezone: string
  onOpenDetails: (video: Video) => void
  isCopied: boolean
  onCopyLink: (e: React.MouseEvent, url: string, id: string) => void
}) {
  const creator = video.creator
  const product = video.product

  return (
    <Card className="group overflow-hidden shadow-none flex flex-col justify-between border-border/80 hover:border-primary/50 hover:shadow-sm transition-all">
      <div>
        {/* Compact Thumbnail Container (4:5 ratio) */}
        <div
          className="relative aspect-[4/5] w-full overflow-hidden bg-muted cursor-pointer"
          onClick={() => onOpenDetails(video)}
        >
          <LazyImage
            src={video.thumbnailUrl}
            alt={video.caption || ''}
            className="transition-transform duration-300 group-hover:scale-105"
            wrapperClassName="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
            {video.isNew ? (
              <span className="rounded bg-emerald-600/90 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wide shadow-xs">
                NEW
              </span>
            ) : (
              <div />
            )}
            <span className="rounded bg-black/60 backdrop-blur-xs px-1.5 py-0.5 text-[9px] text-white/95 font-mono">
              {video.durationSeconds ? `${video.durationSeconds}s` : 'Video'}
            </span>
          </div>

          {/* Bottom Overlay: Direct Metrics On-Cover for Fast Eye Scanning */}
          <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-white pointer-events-none">
            <span className="flex items-center gap-1 text-[11px] font-medium font-mono drop-shadow-sm">
              <Eye className="h-3 w-3 text-white/90" />
              {formatCompactNumber(video.views)}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium font-mono drop-shadow-sm">
              <Heart className="h-3 w-3 text-rose-300" />
              {formatCompactNumber(video.likes)}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-2.5 space-y-1.5">
          {creator && (
            <div
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onOpenDetails(video)}
            >
              <Avatar className="h-4 w-4 shrink-0 border border-border">
                <AvatarImage src={creator.avatarUrl || undefined} />
                <AvatarFallback className="text-[8px]">
                  {creator.displayName?.slice(0, 2).toUpperCase() || 'CR'}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-xs text-foreground truncate">
                {creator.displayName || creator.username}
              </span>
            </div>
          )}

          <p
            className="text-[11px] text-muted-foreground line-clamp-2 leading-tight cursor-pointer hover:text-foreground transition-colors"
            onClick={() => onOpenDetails(video)}
            title={video.caption || undefined}
          >
            {video.caption || 'No caption'}
          </p>

          {product && (
            <div className="flex items-center gap-1 text-[10px] text-primary bg-primary/5 px-1.5 py-0.5 rounded truncate font-medium">
              <ShoppingBag className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{product.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center justify-between border-t px-2.5 py-1.5 bg-muted/20 text-[10px] text-muted-foreground">
        <span title={formatDate(video.publishedAt, displayTimezone)}>
          {formatTimeAgo(video.publishedAt)}
        </span>
        <div className="flex items-center gap-1">
          {video.videoUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px] gap-1 hover:text-primary transition-colors text-muted-foreground"
              title="Copy TikTok video link"
              onClick={(e) => onCopyLink(e, video.videoUrl, video.id)}
            >
              {isCopied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-1.5"
            onClick={() => onOpenDetails(video)}
          >
            Details
          </Button>
          {video.videoUrl && (
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-primary transition-colors text-muted-foreground"
              title="Open on TikTok"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </Card>
  )
})

export function VideoFeedPage() {
  const { settings, refreshKey } = useApp()

  // State
  const [feedSource, setFeedSource] = useState<'monitored' | 'top_ads' | 'trending' | 'hashtags'>('monitored')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [videos, setVideos] = useState<Video[]>([])
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Options for filter selects
  const [creatorsList, setCreatorsList] = useState<Influencer[]>([])
  const [shopsList, setShopsList] = useState<Shop[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [shopFilter, setShopFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'existing'>('all')
  const [sortBy, setSortBy] = useState<string>('published')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Modals & Sheets
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [copiedVideoId, setCopiedVideoId] = useState<string | null>(null)

  const handleCopyLink = async (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation()
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopiedVideoId(id)
      setTimeout(() => setCopiedVideoId(null), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedVideoId(id)
      setTimeout(() => setCopiedVideoId(null), 2000)
    }
  }
  const [sheetOpen, setSheetOpen] = useState(false)

  // Initial load of filter options
  useEffect(() => {
    influencerService
      .getInfluencers({ limit: 100 })
      .then((res) => setCreatorsList(res.data))
      .catch((err) => console.error('Failed to load creators list:', err))

    shopService
      .getShops()
      .then((res) => setShopsList(res))
      .catch((err) => console.error('Failed to load shops list:', err))
  }, [])

  const creatorOptions = React.useMemo<SearchableOption[]>(() => {
    return creatorsList.map((c) => ({
      value: c.id,
      label: c.displayName,
      subLabel: `@${c.username}`,
      avatarUrl: c.avatarUrl,
    }))
  }, [creatorsList])

  const shopOptions = React.useMemo<SearchableOption[]>(() => {
    return shopsList.map((s) => ({
      value: s.id,
      label: s.name,
      subLabel: s.market ? `Market: ${s.market}` : undefined,
    }))
  }, [shopsList])

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: QueryVideosParams = {
        page: currentPage,
        limit: pageSize,
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }

      if (creatorFilter !== 'all') {
        params.creatorId = creatorFilter
      }

      if (shopFilter !== 'all') {
        params.shopId = shopFilter
      }

      if (statusFilter === 'new') {
        params.isNew = true
      }

      if (sortBy === 'published') {
        params.sortBy = 'publishedAt'
        params.sortOrder = 'desc'
      } else if (sortBy === 'detected') {
        params.sortBy = 'firstSeenAt'
        params.sortOrder = 'desc'
      } else if (sortBy === 'views') {
        params.sortBy = 'views'
        params.sortOrder = 'desc'
      } else if (sortBy === 'likes') {
        params.sortBy = 'likes'
        params.sortOrder = 'desc'
      }

      const res = await videoService.getVideos(params)
      setVideos(res.data)
      setPaginationMeta(res.meta)
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearch, creatorFilter, shopFilter, statusFilter, sortBy])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos, refreshKey])

  const openDetails = useCallback((video: Video) => {
    setSelectedVideo(video)
    setSheetOpen(true)
  }, [])

  const handleVideoUpdated = useCallback((updated: Video) => {
    setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          TikTok Video Intelligence Feed
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Explore monitored creator videos, viral US trending feeds, winning TikTok ads, and hashtag metrics.
        </p>
      </div>

      {/* Feed Source Selector Tabs */}
      <Tabs
        value={feedSource}
        onValueChange={(val) => setFeedSource(val as any)}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <TabsList className="h-9 p-1 bg-muted/60">
            <TabsTrigger value="monitored" className="text-xs gap-1.5 h-7">
              <Users className="h-3.5 w-3.5" /> Tracked Influencers ({paginationMeta.total})
            </TabsTrigger>
            <TabsTrigger value="top_ads" className="text-xs gap-1.5 h-7">
              <Trophy className="h-3.5 w-3.5 text-amber-500" /> Winning Ads US
            </TabsTrigger>
            <TabsTrigger value="trending" className="text-xs gap-1.5 h-7">
              <Flame className="h-3.5 w-3.5 text-rose-500" /> US Trending Feed
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="text-xs gap-1.5 h-7">
              <Hash className="h-3.5 w-3.5 text-blue-500" /> Hashtag Explorer
            </TabsTrigger>
          </TabsList>

          {feedSource === 'monitored' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={fetchVideos}
                disabled={isLoading}
                className="h-8 gap-1.5 text-xs"
                title="Refresh videos"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Tabs
                value={viewMode}
                onValueChange={(val) => setViewMode(val as 'grid' | 'table')}
              >
                <TabsList className="h-8 p-0.5">
                  <TabsTrigger value="grid" className="h-7 px-2.5 text-xs gap-1.5">
                    <LayoutGrid className="h-3.5 w-3.5" /> Grid
                  </TabsTrigger>
                  <TabsTrigger value="table" className="h-7 px-2.5 text-xs gap-1.5">
                    <List className="h-3.5 w-3.5" /> Table
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>

        {/* Monitored Tab Content */}
        <TabsContent value="monitored" className="space-y-4 m-0 focus-visible:outline-none">
          {/* Filter Bar */}
          <Card className="shadow-none">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {/* Search With Suggestions (Auto-Suggestions) */}
                <SearchWithSuggestions
                  value={search}
                  onChange={(val) => {
                    setSearch(val)
                    setCurrentPage(1)
                  }}
                  placeholder="Search captions or trends..."
                />

                {/* Creator Filter with Search */}
            <SearchableSelect
              value={creatorFilter}
              onValueChange={(val) => {
                setCreatorFilter(val)
                setCurrentPage(1)
              }}
              options={creatorOptions}
              placeholder="All Creators"
              searchPlaceholder="Search creator name or @username..."
              emptyText="No creators found"
              allOptionLabel="All Creators"
            />

            {/* Shop Filter with Search */}
            <SearchableSelect
              value={shopFilter}
              onValueChange={(val) => {
                setShopFilter(val)
                setCurrentPage(1)
              }}
              options={shopOptions}
              placeholder="All Shops"
              searchPlaceholder="Search brand / shop name..."
              emptyText="No shops found"
              allOptionLabel="All Shops"
            />

            {/* New vs Existing */}
            <Select
              value={statusFilter}
              onValueChange={(val: 'all' | 'new' | 'existing') => {
                setStatusFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Videos</SelectItem>
                <SelectItem value="new">Newly Detected Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Publication Date</SelectItem>
                <SelectItem value="detected">Detection Date</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="likes">Most Likes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className={isLoading && videos.length > 0 ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          {isLoading && videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 rounded-md border border-dashed text-xs text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading video feed from database...</span>
            </div>
          ) : videos.length === 0 ? (
            <div className="rounded-md border border-dashed p-12 text-center text-xs text-muted-foreground">
              No TikTok videos match your search or filter options.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {videos.map((video) => (
                <VideoGridCard
                  key={video.id}
                  video={video}
                  displayTimezone={settings.displayTimezone}
                  onOpenDetails={openDetails}
                  isCopied={copiedVideoId === video.id}
                  onCopyLink={handleCopyLink}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="shadow-none">
          <CardContent className="p-0">
            <Table className={isLoading && videos.length > 0 ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Video & Caption</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Shop Placement</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>First Detected</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && videos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Loading videos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : videos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                      No videos found.
                    </TableCell>
                  </TableRow>
                ) : (
                  videos.map((video) => {
                    const creator = video.creator
                    const product = video.product

                    return (
                      <TableRow key={video.id}>
                        <TableCell>
                          <div className="flex items-start gap-2.5">
                            <div className="relative h-12 w-9 rounded overflow-hidden bg-muted shrink-0 border">
                              <img
                                src={
                                  video.thumbnailUrl ||
                                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80'
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                {video.isNew && (
                                  <Badge variant="secondary" className="bg-emerald-600 text-white text-[9px] py-0 px-1">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs font-medium text-foreground line-clamp-2 mt-0.5">
                                {video.caption || 'No caption'}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {creator && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={creator.avatarUrl || undefined} />
                                <AvatarFallback>
                                  {creator.displayName?.slice(0, 2).toUpperCase() || 'CR'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium text-foreground">
                                {creator.displayName}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="text-xs">
                            <span className="font-medium text-foreground block">
                              {product?.shop?.name || 'Unassigned'}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {product?.name || 'No specific SKU tagged'}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs">
                            <span className="text-foreground block">
                              {formatDate(video.publishedAt, settings.displayTimezone)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimeAgo(video.publishedAt)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs">
                            <span className="text-foreground block">
                              {formatDateTime(video.firstSeenAt, settings.displayTimezone)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimeAgo(video.firstSeenAt)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-mono text-xs">
                          {formatCompactNumber(video.views)}
                        </TableCell>

                        <TableCell className="text-right font-mono text-xs">
                          {formatCompactNumber(video.likes)}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {video.videoUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                title="Copy TikTok video link"
                                onClick={(e) => handleCopyLink(e, video.videoUrl, video.id)}
                              >
                                {copiedVideoId === video.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span className="text-emerald-600 font-medium">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => openDetails(video)}
                            >
                              Details
                            </Button>
                            {video.videoUrl && (
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                title="Open on TikTok"
                              >
                                <a href={video.videoUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Pagination Bar */}
      <Card className="shadow-none">
        <CardContent className="p-0">
          <DataTablePagination
            currentPage={currentPage}
            totalPages={paginationMeta.totalPages}
            totalItems={paginationMeta.total}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newPageSize) => {
              setPageSize(newPageSize)
              setCurrentPage(1)
            }}
            pageSizeOptions={[10, 20, 40, 100]}
            itemLabel="videos"
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
      </TabsContent>

      {/* 1. Winning Ads US */}
      <TabsContent value="top_ads" className="m-0 focus-visible:outline-none">
        <WinningAdsSection />
      </TabsContent>

      {/* 3. Live Trending Feed */}
      <TabsContent value="trending" className="m-0 focus-visible:outline-none">
        <TrendingFeedSection />
      </TabsContent>

      {/* 4. Hashtag Explorer */}
      <TabsContent value="hashtags" className="m-0 focus-visible:outline-none">
        <HashtagExplorerSection />
      </TabsContent>
    </Tabs>

      {/* Video Detail Sheet */}
      <VideoDetailSheet
        video={selectedVideo}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onVideoUpdated={handleVideoUpdated}
      />
    </div>
  )
}
