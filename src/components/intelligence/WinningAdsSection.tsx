import React, { useState, useEffect } from 'react'
import {
  Trophy,
  ExternalLink,
  Heart,
  TrendingUp,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
  Play,
  Percent,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { intelligenceService, TopAdItem } from '@/services/intelligence.service'
import { formatCompactNumber } from '@/utils/formatters'
import { LazyImage } from '@/components/common/LazyImage'

const adsCache: Record<string, TopAdItem[]> = {}

export function WinningAdsSection() {
  const [period, setPeriod] = useState<number>(7)
  const [sort, setSort] = useState<string>('for_you')
  const cacheKey = `${period}-${sort}`

  const [ads, setAds] = useState<TopAdItem[]>(() => adsCache[cacheKey] || [])
  const [isLoading, setIsLoading] = useState(() => !adsCache[cacheKey])
  const [selectedAd, setSelectedAd] = useState<TopAdItem | null>(null)

  const loadAds = async (forceRefresh = false) => {
    if (!forceRefresh && adsCache[cacheKey]) {
      setAds(adsCache[cacheKey])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await intelligenceService.getTopAds({
        country: 'US',
        period,
        sort,
      })
      const items = res.ads || []
      adsCache[cacheKey] = items
      setAds(items)
    } catch (err) {
      console.error('Failed to load top winning ads:', err)
      if (!adsCache[cacheKey]) setAds([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAds()
  }, [period, sort])

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <Card className="shadow-none">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                TikTok Creative Center - Winning Ads US
                <Badge variant="outline" className="text-[10px] bg-amber-500/5 text-amber-600 border-amber-200">
                  Live US Market
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Top converting ads with highest engagement and click-through rates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={String(period)} onValueChange={(val) => setPeriod(Number(val))}>
              <SelectTrigger className="h-8 text-xs w-28">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-8 text-xs w-32">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="for_you">For You (Smart)</SelectItem>
                <SelectItem value="ctr">Highest CTR</SelectItem>
                <SelectItem value="like">Most Likes</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1"
              onClick={() => loadAds(true)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Ads */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-md border border-dashed text-xs text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Fetching top creative winning ads from TikTok Creative Center...</span>
        </div>
      ) : ads.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center text-xs text-muted-foreground">
          No winning ads found for this period. Try changing the time window or sort option.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {ads.map((ad) => {
            const video = ad.video || {}
            const cover = video.cover
            const duration = video.duration_seconds ? Math.round(video.duration_seconds) : null

            return (
              <Card
                key={ad.id}
                className="group overflow-hidden shadow-none flex flex-col justify-between border-border/80 hover:border-amber-400/60 hover:shadow-sm transition-all"
              >
                <div>
                  {/* Thumbnail */}
                  <div
                    className="relative aspect-[4/5] w-full overflow-hidden bg-muted cursor-pointer"
                    onClick={() => setSelectedAd(ad)}
                  >
                    <LazyImage
                      src={cover}
                      alt={ad.caption || 'TikTok Ad'}
                      className="transition-transform duration-300 group-hover:scale-105"
                      wrapperClassName="h-full w-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                      <span className="rounded bg-amber-500/90 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wide shadow-xs flex items-center gap-0.5">
                        <Sparkles className="h-2.5 w-2.5" /> TOP AD
                      </span>
                      {duration && (
                        <span className="rounded bg-black/60 backdrop-blur-xs px-1.5 py-0.5 text-[9px] text-white/95 font-mono">
                          {duration}s
                        </span>
                      )}
                    </div>

                    {/* CTR & Likes on cover */}
                    <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-white pointer-events-none">
                      {ad.ctr !== undefined && (
                        <span className="flex items-center gap-0.5 text-[11px] font-bold font-mono text-emerald-300 drop-shadow-sm">
                          <Percent className="h-2.5 w-2.5" /> CTR {(ad.ctr * 100).toFixed(1)}%
                        </span>
                      )}
                      {ad.like_count !== undefined && (
                        <span className="flex items-center gap-1 text-[11px] font-medium font-mono drop-shadow-sm">
                          <Heart className="h-3 w-3 text-rose-300" />
                          {formatCompactNumber(ad.like_count)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-2.5 space-y-1.5">
                    {ad.brand_name && (
                      <div className="text-[11px] font-semibold text-foreground truncate">
                        {ad.brand_name}
                      </div>
                    )}
                    <p
                      className="text-[11px] text-muted-foreground line-clamp-2 leading-tight cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => setSelectedAd(ad)}
                      title={ad.caption || undefined}
                    >
                      {ad.caption || 'TikTok Creative Center Ad'}
                    </p>
                    {ad.objective && (
                      <div className="inline-block text-[9px] uppercase tracking-wider text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                        Obj: {ad.objective}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t px-2.5 py-1.5 bg-muted/20 text-[10px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-1.5 gap-1 text-primary hover:text-primary"
                    onClick={() => setSelectedAd(ad)}
                  >
                    <Play className="h-2.5 w-2.5 fill-current" /> Preview
                  </Button>
                  {ad.link && (
                    <a
                      href={ad.link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Open on Creative Center"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Video Preview Modal */}
      {selectedAd && (
        <Dialog open={Boolean(selectedAd)} onOpenChange={(open) => !open && setSelectedAd(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center justify-between pr-4">
                <span>Winning Ad Preview</span>
                <Badge variant="outline" className="text-xs">Creative Center</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {selectedAd.video?.play_links?.[0]?.link ? (
                <div className="aspect-[9/16] w-full max-h-[420px] bg-black rounded-md overflow-hidden flex items-center justify-center">
                  <video
                    src={selectedAd.video.play_links[0].link}
                    controls
                    autoPlay
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : selectedAd.video?.cover ? (
                <div className="aspect-[9/16] w-full max-h-[350px] bg-black rounded-md overflow-hidden">
                  <img src={selectedAd.video.cover} alt="" className="h-full w-full object-contain" />
                </div>
              ) : null}

              <div className="space-y-1.5 text-xs">
                {selectedAd.brand_name && (
                  <div className="font-semibold text-foreground">Brand: {selectedAd.brand_name}</div>
                )}
                <p className="text-muted-foreground">{selectedAd.caption}</p>
                <div className="flex items-center gap-3 pt-2 text-[11px] text-muted-foreground font-mono">
                  {selectedAd.ctr !== undefined && (
                    <span>CTR: {(selectedAd.ctr * 100).toFixed(2)}%</span>
                  )}
                  {selectedAd.like_count !== undefined && (
                    <span>Likes: {formatCompactNumber(selectedAd.like_count)}</span>
                  )}
                  {selectedAd.objective && <span>Objective: {selectedAd.objective}</span>}
                </div>
              </div>

              {selectedAd.link && (
                <Button asChild size="sm" className="w-full gap-1.5 text-xs">
                  <a href={selectedAd.link} target="_blank" rel="noreferrer">
                    View Script & Breakdown on Creative Center <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default WinningAdsSection

