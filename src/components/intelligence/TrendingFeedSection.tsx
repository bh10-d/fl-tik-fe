import React, { useState, useEffect } from 'react'
import {
  Flame,
  ExternalLink,
  Eye,
  Heart,
  MessageSquare,
  Music2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { intelligenceService, TrendingVideoItem } from '@/services/intelligence.service'
import { formatCompactNumber, formatTimeAgo } from '@/utils/formatters'
import { LazyImage } from '@/components/common/LazyImage'

let trendingCache: TrendingVideoItem[] | null = null

export function TrendingFeedSection() {
  const [videos, setVideos] = useState<TrendingVideoItem[]>(() => trendingCache || [])
  const [isLoading, setIsLoading] = useState(() => !trendingCache)

  const loadTrending = async (forceRefresh = false) => {
    if (!forceRefresh && trendingCache && trendingCache.length > 0) {
      setVideos(trendingCache)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await intelligenceService.getTrendingFeed({ country: 'US' })
      const items = res.videos || []
      trendingCache = items
      setVideos(items)
    } catch (err) {
      console.error('Failed to load trending feed:', err)
      if (!trendingCache) setVideos([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTrending()
  }, [])

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <Card className="shadow-none">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-500/10 text-rose-600">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                Live US Trending Feed
                <Badge variant="outline" className="text-[10px] bg-rose-500/5 text-rose-600 border-rose-200">
                  30 Fresh Videos
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Emerging viral videos, sounds, and challenges across the United States.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1.5"
            onClick={() => loadTrending(true)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </Button>
        </CardContent>
      </Card>

      {/* Grid of Trending Videos */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-md border border-dashed text-xs text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Fetching live viral trending feed from TikTok US...</span>
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center text-xs text-muted-foreground">
          Could not fetch trending videos at this moment. Please refresh.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {videos.map((v) => {
            const author = v.author || {}
            const stats = v.stats || {}
            const cover = v.cover

            return (
              <Card
                key={v.id}
                className="group overflow-hidden shadow-none flex flex-col justify-between border-border/80 hover:border-rose-400/60 hover:shadow-sm transition-all"
              >
                <div>
                  {/* Thumbnail (4:5) */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                    <LazyImage
                      src={cover}
                      alt={v.description || 'Trending Video'}
                      className="transition-transform duration-300 group-hover:scale-105"
                      wrapperClassName="h-full w-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                      <span className="rounded bg-rose-600/90 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wide shadow-xs flex items-center gap-0.5">
                        <Flame className="h-2.5 w-2.5 fill-current" /> TRENDING
                      </span>
                    </div>

                    {/* Metrics Overlaid on cover bottom */}
                    <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-white pointer-events-none">
                      <span className="flex items-center gap-1 text-[11px] font-medium font-mono drop-shadow-sm">
                        <Eye className="h-3 w-3 text-white/90" />
                        {formatCompactNumber(stats.play_count || 0)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium font-mono drop-shadow-sm">
                        <Heart className="h-3 w-3 text-rose-300" />
                        {formatCompactNumber(stats.like_count || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-2.5 space-y-1.5">
                    {author.username && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar className="h-4 w-4 shrink-0 border border-border">
                          <AvatarImage src={author.profile_picture} />
                          <AvatarFallback className="text-[8px]">
                            {author.username?.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] font-semibold text-foreground truncate">
                          {author.nickname || author.username}
                        </span>
                      </div>
                    )}

                    <p
                      className="text-[11px] text-muted-foreground line-clamp-2 leading-tight"
                      title={v.description || undefined}
                    >
                      {v.description || 'TikTok Trending Video'}
                    </p>

                    {v.music?.title && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                        <Music2 className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{v.music.title}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t px-2.5 py-1.5 bg-muted/20 text-[10px] text-muted-foreground">
                  <span>{v.created_at ? formatTimeAgo(v.created_at) : 'Viral now'}</span>
                  {v.link && (
                    <a
                      href={v.link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:text-primary transition-colors flex items-center gap-0.5"
                      title="Open on TikTok"
                    >
                      <span>TikTok</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TrendingFeedSection


