import React, { useState, useEffect } from 'react'
import {
  Hash,
  Search,
  ExternalLink,
  Eye,
  Heart,
  Video,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  intelligenceService,
  HashtagDetailsResponse,
  TrendingVideoItem,
} from '@/services/intelligence.service'
import { formatCompactNumber } from '@/utils/formatters'
import { LazyImage } from '@/components/common/LazyImage'

const POPULAR_HASHTAGS = [
  'tiktokshop',
  'deals',
  'amazonfinds',
  'virallipstick',
  'tiktokmademebuyit',
  'unboxing',
]

const hashtagCache: Record<string, { details: HashtagDetailsResponse | null; videos: TrendingVideoItem[] }> = {}

export function HashtagExplorerSection() {
  const [hashtagInput, setHashtagInput] = useState('tiktokshop')
  const [activeTag, setActiveTag] = useState('tiktokshop')
  const [details, setDetails] = useState<HashtagDetailsResponse | null>(() => hashtagCache['tiktokshop']?.details || null)
  const [videos, setVideos] = useState<TrendingVideoItem[]>(() => hashtagCache['tiktokshop']?.videos || [])
  const [isLoading, setIsLoading] = useState(() => !hashtagCache['tiktokshop'])

  const searchTag = async (tag: string, force = false) => {
    const clean = tag.replace(/^#/, '').trim()
    if (!clean) return
    setActiveTag(clean)

    if (!force && hashtagCache[clean]) {
      setDetails(hashtagCache[clean].details)
      setVideos(hashtagCache[clean].videos)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const [tagData, videoData] = await Promise.allSettled([
        intelligenceService.getHashtagDetails(clean),
        intelligenceService.getHashtagVideos(clean),
      ])

      const resolvedDetails = tagData.status === 'fulfilled' ? tagData.value : null
      const resolvedVideos = videoData.status === 'fulfilled' ? videoData.value.videos || [] : []

      hashtagCache[clean] = {
        details: resolvedDetails,
        videos: resolvedVideos,
      }

      setDetails(resolvedDetails)
      setVideos(resolvedVideos)
    } catch (err) {
      console.error('Failed to search hashtag:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    searchTag('tiktokshop')
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchTag(hashtagInput)
  }

  return (
    <div className="space-y-4">
      {/* Search & Presets Toolbar */}
      <Card className="shadow-none">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Hash className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  placeholder="Enter hashtag, e.g. tiktokshop, deals..."
                  className="h-8 pl-8 text-xs font-mono"
                />
              </div>
              <Button type="submit" size="sm" className="h-8 px-3 text-xs gap-1" disabled={isLoading}>
                <Search className="h-3 w-3" />
                <span>Inspect</span>
              </Button>
            </form>

            {/* Quick chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-medium mr-1">Trending:</span>
              {POPULAR_HASHTAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setHashtagInput(tag)
                    searchTag(tag)
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    activeTag === tag
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hashtag Metrics Banner */}
      {details && (
        <Card className="shadow-none bg-gradient-to-r from-muted/30 to-card border-border">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xl font-bold font-mono shrink-0">
                #
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground font-mono">
                    #{details.name}
                  </h3>
                  {details.link && (
                    <a
                      href={details.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                {details.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl mt-0.5">
                    {details.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 sm:gap-8 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Eye className="h-3 w-3 text-primary" /> Total Views
                </div>
                <div className="text-lg font-bold font-mono text-foreground">
                  {formatCompactNumber(details.view_count || 0)}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Video className="h-3 w-3 text-primary" /> Total Videos
                </div>
                <div className="text-lg font-bold font-mono text-foreground">
                  {formatCompactNumber(details.video_count || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hashtag Videos Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-md border border-dashed text-xs text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Fetching hashtag details and top videos...</span>
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center text-xs text-muted-foreground">
          No videos found for #{activeTag}. Try another hashtag like #deals or #tiktokshop.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {videos.map((v) => {
            const stats = v.stats || {}
            return (
              <Card
                key={v.id}
                className="group overflow-hidden shadow-none flex flex-col justify-between border-border/80 hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                    <LazyImage
                      src={v.cover}
                      alt={v.description || `#${activeTag} video`}
                      className="transition-transform duration-300 group-hover:scale-105"
                      wrapperClassName="h-full w-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35 pointer-events-none" />

                    <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                      <span className="rounded bg-black/60 backdrop-blur-xs px-1.5 py-0.5 text-[9px] text-white/95 font-mono">
                        #{activeTag}
                      </span>
                    </div>

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

                  <div className="p-2.5 space-y-1.5">
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                      {v.description || `#${activeTag} video`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t px-2.5 py-1.5 bg-muted/20 text-[10px] text-muted-foreground">
                  <span>TikTok Video</span>
                  {v.link && (
                    <a
                      href={v.link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:text-primary transition-colors flex items-center gap-0.5"
                    >
                      <span>Watch</span>
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

export default HashtagExplorerSection


