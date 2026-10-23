import React, { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Video, MetricSnapshot } from '@/types'
import {
  ExternalLink,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  Clock,
  ShoppingBag,
  TrendingUp,
  RotateCw,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react'
import {
  formatCompactNumber,
  formatDateTime,
  formatTimeAgo,
} from '@/utils/formatters'
import { useApp } from '@/context/AppContext'
import { videoService } from '@/services/video.service'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface VideoDetailSheetProps {
  video: Video | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onVideoUpdated?: (updatedVideo: Video) => void
}

export function VideoDetailSheet({
  video: initialVideo,
  open,
  onOpenChange,
  onVideoUpdated,
}: VideoDetailSheetProps) {
  const { settings, triggerRefresh } = useApp()
  const [video, setVideo] = useState<Video | null>(initialVideo)
  const [metrics, setMetrics] = useState<MetricSnapshot[]>([])
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshSuccess, setRefreshSuccess] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyLink = async (url: string) => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  // Live Scraper Comments
  const [comments, setComments] = useState<any[]>([])
  const [totalCommentsCount, setTotalCommentsCount] = useState<number>(0)
  const [isLoadingComments, setIsLoadingComments] = useState(false)

  const loadMetrics = useCallback(async (videoId: string) => {
    setIsLoadingMetrics(true)
    try {
      const data = await videoService.getVideoMetrics(videoId)
      setMetrics(data)
    } catch (err) {
      console.error('Failed to load video metrics history:', err)
    } finally {
      setIsLoadingMetrics(false)
    }
  }, [])

  const loadComments = useCallback(async (videoId: string) => {
    setIsLoadingComments(true)
    try {
      const res = await videoService.getVideoComments(videoId)
      setComments(res?.comments || [])
      setTotalCommentsCount(res?.total_count || res?.comment_count || 0)
    } catch (err) {
      console.error('Failed to load comments from scraper:', err)
      setComments([])
    } finally {
      setIsLoadingComments(false)
    }
  }, [])

  useEffect(() => {
    setVideo(initialVideo)
    setRefreshSuccess(false)
    if (initialVideo?.id && open) {
      loadMetrics(initialVideo.id)
      loadComments(initialVideo.id)
    } else {
      setMetrics([])
      setComments([])
    }
  }, [initialVideo, open, loadMetrics, loadComments])

  const handleRefreshVideo = async () => {
    if (!video) return
    setIsRefreshing(true)
    setRefreshSuccess(false)
    try {
      const res = await videoService.refreshVideo(video.id)
      setVideo(res.video)
      if (onVideoUpdated) onVideoUpdated(res.video)
      triggerRefresh()
      await loadMetrics(video.id)
      setRefreshSuccess(true)
      setTimeout(() => setRefreshSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to refresh video:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!video) return null

  const creator = video.creator
  const product = video.product

  const chartData = metrics.map((s, index) => {
    const date = new Date(s.capturedAt)
    const timeLabel = isNaN(date.getTime())
      ? `T+${index * 2}h`
      : `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

    return {
      time: timeLabel,
      views: s.views,
      likes: s.likes,
      comments: s.comments,
    }
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base font-bold">
                  Video Intelligence Details
                </SheetTitle>
                {video.isNew && (
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[10px] py-0 px-1.5">
                    Newly Discovered
                  </Badge>
                )}
              </div>
              <SheetDescription className="text-xs mt-0.5">
                TikTok Shop US promotion monitoring & metric velocity
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs"
                onClick={handleRefreshVideo}
                disabled={isRefreshing}
                title="Fetch latest metrics from provider"
              >
                {isRefreshing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : refreshSuccess ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <RotateCw className="h-3 w-3" />
                )}
                {isRefreshing ? 'Syncing...' : refreshSuccess ? 'Synced' : 'Sync'}
              </Button>
              {video.videoUrl && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopyLink(video.videoUrl)}
                    title="Copy TikTok video link"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </Button>
                  <Button asChild size="sm" variant="default" className="h-8 gap-1 text-xs">
                    <a href={video.videoUrl} target="_blank" rel="noreferrer">
                      TikTok <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Video Preview & Creator Info */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="relative aspect-[9/16] w-full sm:w-36 rounded-md overflow-hidden bg-muted border shrink-0">
            <img
              src={
                video.thumbnailUrl ||
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80'
              }
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-[9px] bg-black/70 text-white border-0">
                {video.durationSeconds ? `${video.durationSeconds}s` : 'Video'}
              </Badge>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {creator && (
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={creator.avatarUrl || undefined} />
                  <AvatarFallback>
                    {creator.displayName ? creator.displayName.slice(0, 2).toUpperCase() : 'CR'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-foreground truncate">
                    {creator.displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    @{creator.username}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-md border bg-muted/20 p-2.5 text-xs text-foreground leading-relaxed">
              <span className="font-medium text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">
                Video Caption & Tags
              </span>
              {video.caption || 'No caption provided.'}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border p-2 bg-card">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-medium">
                  <Calendar className="h-3 w-3" /> Published At
                </div>
                <div className="font-medium text-xs mt-0.5 text-foreground">
                  {formatDateTime(video.publishedAt, settings.displayTimezone)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Source: {video.publishedAtSource || video.dataSource || 'PROVIDER'}
                </div>
              </div>

              <div className="rounded-md border p-2 bg-card">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-medium">
                  <Clock className="h-3 w-3" /> First Detected
                </div>
                <div className="font-medium text-xs mt-0.5 text-foreground">
                  {formatDateTime(video.firstSeenAt, settings.displayTimezone)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {formatTimeAgo(video.firstSeenAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 my-4">
          <div className="rounded-md border bg-card p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground uppercase font-medium flex items-center justify-center gap-1">
              <Eye className="h-3 w-3" /> Views
            </span>
            <p className="text-sm font-bold mt-0.5 text-foreground font-mono">
              {formatCompactNumber(video.views)}
            </p>
          </div>
          <div className="rounded-md border bg-card p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground uppercase font-medium flex items-center justify-center gap-1">
              <Heart className="h-3 w-3" /> Likes
            </span>
            <p className="text-sm font-bold mt-0.5 text-foreground font-mono">
              {formatCompactNumber(video.likes)}
            </p>
          </div>
          <div className="rounded-md border bg-card p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground uppercase font-medium flex items-center justify-center gap-1">
              <MessageSquare className="h-3 w-3" /> Comments
            </span>
            <p className="text-sm font-bold mt-0.5 text-foreground font-mono">
              {formatCompactNumber(video.comments)}
            </p>
          </div>
          <div className="rounded-md border bg-card p-2.5 text-center">
            <span className="text-[10px] text-muted-foreground uppercase font-medium flex items-center justify-center gap-1">
              <Share2 className="h-3 w-3" /> Shares
            </span>
            <p className="text-sm font-bold mt-0.5 text-foreground font-mono">
              {formatCompactNumber(video.shares)}
            </p>
          </div>
        </div>

        {/* Historical Snapshots Trend */}
        <div className="rounded-md border p-3 my-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Engagement Growth Snapshots
            </span>
            <span className="text-[10px] text-muted-foreground">
              {metrics.length} snapshot(s) recorded
            </span>
          </div>
          {isLoadingMetrics ? (
            <div className="h-36 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading metric timeline...</span>
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="stroke-muted/30" />
                  <XAxis dataKey="time" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    name="Views"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="likes"
                    name="Likes"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-xs text-muted-foreground">
              No historical metric snapshots available yet.
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Associated Shop & Product */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tagged TikTok Shop / Product Placements
          </h4>

          {product ? (
            <div className="rounded-md border p-3 bg-card space-y-2 text-xs">
              <div className="flex items-center gap-3">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-10 w-10 rounded object-cover border shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs text-foreground truncate">
                    {product.name}
                  </p>
                  {product.shop && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <ShoppingBag className="h-3 w-3" /> Shop: {product.shop.name}
                    </p>
                  )}
                  {product.productUrl && (
                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      View on TikTok Shop <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
              No specific product catalog item linked to this video yet.
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Live Scraper Comments Section */}
        <div className="space-y-3 pb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" /> Live Viewer Comments ({comments.length || totalCommentsCount})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => video?.id && loadComments(video.id)}
              disabled={isLoadingComments}
            >
              <RotateCw className={`h-2.5 w-2.5 ${isLoadingComments ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          {isLoadingComments ? (
            <div className="h-24 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Fetching live comments via internal crawler...</span>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {comments.map((comment: any, idx: number) => {
                const user = comment.user || comment.author || {}
                const avatar = user.avatar_thumb || user.profile_picture || user.avatarUrl
                const name = user.nickname || user.username || 'TikTok Viewer'
                return (
                  <div key={comment.id || idx} className="rounded-md border p-2.5 bg-card/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <Avatar className="h-4 w-4 border">
                          <AvatarImage src={avatar} />
                          <AvatarFallback className="text-[8px]">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-[11px] text-foreground truncate">{name}</span>
                      </div>
                      {comment.like_count !== undefined && comment.like_count > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                          <Heart className="h-2.5 w-2.5 text-rose-500" /> {formatCompactNumber(comment.like_count)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground/90 pl-5 leading-snug">
                      {comment.text || comment.content || comment.comment || ''}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
              No comments detected on TikTok for this video yet.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
