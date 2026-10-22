import React, { useState, useEffect } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Influencer, Video } from '@/types'
import {
  ExternalLink,
  Eye,
  Heart,
  Play,
  CheckCircle2,
  PauseCircle,
  RotateCw,
  RefreshCw,
  ShoppingBag,
  Package,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatTimeAgo,
} from '@/utils/formatters'
import { useApp } from '@/context/AppContext'
import { influencerService } from '@/services/influencer.service'

interface InfluencerDetailSheetProps {
  influencerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

export function InfluencerDetailSheet({
  influencerId,
  open,
  onOpenChange,
  onUpdated,
}: InfluencerDetailSheetProps) {
  const { settings, triggerRefresh } = useApp()

  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionPending, setActionPending] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !influencerId) {
      setInfluencer(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setSyncStatus(null)

    influencerService
      .getInfluencerById(influencerId)
      .then((data) => {
        if (isMounted) setInfluencer(data)
      })
      .catch((err) => {
        console.error('Failed to load creator details:', err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, influencerId])

  if (!influencerId) return null

  const handleToggleTracking = async () => {
    if (!influencer) return
    setActionPending(true)
    try {
      const isCurrentlyActive =
        influencer.trackingStatus === 'ACTIVE' || influencer.trackingStatus === 'active'

      const updated = isCurrentlyActive
        ? await influencerService.pauseInfluencer(influencer.id)
        : await influencerService.trackInfluencer(influencer.id)

      setInfluencer(updated)
      triggerRefresh()
      onUpdated?.()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update tracking status')
    } finally {
      setActionPending(false)
    }
  }

  const handleManualSync = async () => {
    if (!influencer) return
    setActionPending(true)
    setSyncStatus('Syncing videos with crawler...')
    try {
      const result = await influencerService.syncInfluencer(influencer.id)
      setSyncStatus(result.message || 'Sync completed successfully')

      // Re-fetch creator details to immediately update videos and statistics
      const fresh = await influencerService.getInfluencerById(influencer.id)
      if (fresh) {
        setInfluencer(fresh)
        const count = fresh.videos?.length ?? fresh.videoCount ?? 0
        setSyncStatus(`Sync complete! ${count} videos found`)
      }
      triggerRefresh()
      onUpdated?.()
    } catch (err: unknown) {
      setSyncStatus(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setActionPending(false)
    }
  }

  const creatorVideos = influencer?.videos || []
  const totalViews = creatorVideos.reduce((sum, v) => sum + (v.views || 0), 0)
  const totalLikes = creatorVideos.reduce((sum, v) => sum + (v.likes || 0), 0)

  const isStatusActive =
    influencer?.trackingStatus === 'ACTIVE' || influencer?.trackingStatus === 'active'
  const isStatusPaused =
    influencer?.trackingStatus === 'PAUSED' || influencer?.trackingStatus === 'paused'

  const statusVariant = isStatusActive ? 'success' : isStatusPaused ? 'secondary' : 'destructive'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="text-left">
          {loading || !influencer ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={influencer.avatarUrl || undefined} />
                  <AvatarFallback>
                    {influencer.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-base font-bold">
                      {influencer.displayName}
                    </SheetTitle>
                    <Badge variant={statusVariant} className="capitalize text-[11px]">
                      {influencer.trackingStatus.toLowerCase()}
                    </Badge>
                  </div>
                  <SheetDescription className="text-xs">
                    @{influencer.username} • {influencer.category || 'General'}
                  </SheetDescription>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs">
                <a
                  href={influencer.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Profile <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
        </SheetHeader>

        {influencer && (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-5">
              <div className="rounded-md border bg-card p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Followers</span>
                <p className="text-sm font-bold mt-0.5">{formatCompactNumber(influencer.followers)}</p>
              </div>
              <div className="rounded-md border bg-card p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Tracked Videos</span>
                <p className="text-sm font-bold mt-0.5">{influencer.videoCount ?? creatorVideos.length}</p>
              </div>
              <div className="rounded-md border bg-card p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Total Views</span>
                <p className="text-sm font-bold mt-0.5">{formatCompactNumber(totalViews)}</p>
              </div>
              <div className="rounded-md border bg-card p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Total Likes</span>
                <p className="text-sm font-bold mt-0.5">{formatCompactNumber(totalLikes)}</p>
              </div>
            </div>

            {/* Crawler Metadata and Actions */}
            <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monitoring Added:</span>
                <span className="font-medium text-foreground">
                  {formatDateTime(influencer.createdAt, settings.displayTimezone)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Scraper Run:</span>
                <span className="font-medium text-foreground">
                  {formatDateTime(influencer.lastCheckedAt, settings.displayTimezone)} ({formatTimeAgo(influencer.lastCheckedAt)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Scheduled Run:</span>
                <span className="font-medium text-foreground">
                  {influencer.nextScheduledCheckAt
                    ? formatDateTime(influencer.nextScheduledCheckAt, settings.displayTimezone)
                    : 'N/A'}
                </span>
              </div>

              {influencer.lastSyncError && (
                <div className="text-destructive font-mono text-[10px] pt-1">
                  Last Error: {influencer.lastSyncError}
                </div>
              )}

              {syncStatus && (
                <div className="text-blue-600 font-mono text-[11px] pt-1 border-t">
                  {syncStatus}
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleToggleTracking}
                  disabled={actionPending}
                >
                  {isStatusActive ? (
                    <>
                      <PauseCircle className="mr-1 h-3.5 w-3.5 text-amber-600" /> Pause Tracking
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Resume Tracking
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleManualSync}
                  disabled={actionPending}
                >
                  <RefreshCw className={`mr-1 h-3.5 w-3.5 text-blue-600 ${actionPending ? 'animate-spin' : ''}`} />
                  Sync Videos Now
                </Button>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Videos & Tagged Products Tabs */}
            <Tabs defaultValue="videos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
                <TabsTrigger value="videos" className="text-xs">
                  Videos ({creatorVideos.length})
                </TabsTrigger>
                <TabsTrigger value="products" className="text-xs gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
                  TikTok Shop ({(influencer.taggedProducts || []).length})
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Videos List */}
              <TabsContent value="videos" className="space-y-3 mt-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Discovered Videos ({creatorVideos.length})
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    US TikTok Shop Promos
                  </span>
                </div>

                {creatorVideos.length === 0 ? (
                  <div className="rounded-md border border-dashed p-8 text-center text-xs text-muted-foreground">
                    No promotional videos retrieved yet. Click "Sync Videos Now" to query the active provider.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {creatorVideos.map((vid) => {
                      const assocProduct =
                        (vid as any).productAssociations?.[0]?.product || vid.product
                      return (
                        <div
                          key={vid.id}
                          className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="relative h-16 w-12 rounded overflow-hidden bg-muted shrink-0 border">
                            {vid.thumbnailUrl ? (
                              <img
                                src={vid.thumbnailUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-slate-200 flex items-center justify-center text-[8px] text-muted-foreground">
                                No preview
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Play className="h-3.5 w-3.5 text-white fill-white opacity-80" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-medium text-foreground line-clamp-1">
                                {vid.caption || 'No caption'}
                              </p>
                              {vid.isNew && (
                                <Badge variant="success" className="text-[9px] py-0 px-1 shrink-0">
                                  New
                                </Badge>
                              )}
                            </div>

                            {/* Tagged Product pill if video has cart */}
                            {assocProduct && (
                              <a
                                href={assocProduct.productUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/20 max-w-fit transition-colors"
                              >
                                <ShoppingBag className="h-2.5 w-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span className="truncate max-w-[200px] font-medium">
                                  {assocProduct.name}
                                </span>
                                <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-70" />
                              </a>
                            )}

                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {formatCompactNumber(vid.views)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" /> {formatCompactNumber(vid.likes)}
                              </span>
                            </div>

                            <div className="mt-2 text-[10px] text-muted-foreground space-y-0.5">
                              <div>
                                Published: {formatDateTime(vid.publishedAt, settings.displayTimezone)}
                              </div>
                              <div>
                                First Detected: {formatDateTime(vid.firstSeenAt, settings.displayTimezone)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: Tagged Products List */}
              <TabsContent value="products" className="space-y-3 mt-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tagged Products ({(influencer.taggedProducts || []).length})
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    TikTok Shop US
                  </span>
                </div>

                {(!influencer.taggedProducts || influencer.taggedProducts.length === 0) ? (
                  <div className="rounded-md border border-dashed p-8 text-center text-xs text-muted-foreground space-y-1">
                    <ShoppingBag className="h-6 w-6 mx-auto text-muted-foreground/50 mb-1" />
                    <p className="font-medium text-foreground">No TikTok Shop Products Detected Yet</p>
                    <p className="text-[11px]">
                      When this creator publishes videos with TikTok Shop product tags (yellow cart), they will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {influencer.taggedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="relative h-14 w-14 rounded overflow-hidden bg-muted shrink-0 border">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-slate-100 flex items-center justify-center text-[8px] text-muted-foreground">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground line-clamp-1">
                            {prod.name}
                          </p>
                          {prod.shopName && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Shop: <span className="font-medium text-foreground">{prod.shopName}</span>
                            </p>
                          )}
                          <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t text-[10px] text-muted-foreground">
                            <span>
                              Last Tagged: {formatDate(prod.lastTaggedAt, settings.displayTimezone)}
                            </span>
                            {prod.productUrl && (
                              <a
                                href={prod.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                              >
                                View Product <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
