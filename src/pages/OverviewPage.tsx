import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Video as VideoIcon,
  Flame,
  ArrowUpRight,
  Clock,
  ExternalLink,
  ShieldCheck,
  Play,
  TrendingUp,
  RotateCw,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useApp } from '@/context/AppContext'
import { dashboardService } from '@/services/dashboard.service'
import { videoService } from '@/services/video.service'
import {
  DashboardOverview,
  PublishingTrend,
  ActiveCreator,
  Video,
} from '@/types'
import {
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatTimeAgo,
} from '@/utils/formatters'

export function OverviewPage() {
  const { settings, refreshKey } = useApp()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [trends, setTrends] = useState<PublishingTrend[]>([])
  const [topCreators, setTopCreators] = useState<ActiveCreator[]>([])
  const [recentVideos, setRecentVideos] = useState<Video[]>([])

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewData, trendsData, creatorsData, videosData] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getPublishingTrends(7),
        dashboardService.getMostActiveCreators(30, 5),
        videoService.getRecentVideos(5),
      ])

      setOverview(overviewData)
      setTrends(trendsData)
      setTopCreators(creatorsData)
      setRecentVideos(videosData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard overview data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData, refreshKey])

  // Format trend data for Area Chart
  const chartData = trends.map((t) => ({
    day: formatDate(t.date),
    published: t.publishedCount,
    detected: t.detectedCount,
  }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            TikTok Shop US Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time creator video tracking, product placements, and publishing cadence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadDashboardData}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/tracking">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Tracking Activity
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/influencers">
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Manage Creators
            </Link>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between">
          <span>Failed to load live analytics data: {error}</span>
          <Button size="sm" variant="outline" onClick={loadDashboardData} className="h-7 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tracked Influencers
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {overview?.totalCreators ?? 0}
              </div>
            )}
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32 mt-1" />
              ) : (
                <>
                  <Badge variant="success" className="mr-1.5 py-0 px-1 text-[10px]">
                    <TrendingUp className="mr-0.5 h-2.5 w-2.5" /> Active
                  </Badge>
                  <span>{overview?.activeTrackedCreators ?? 0} actively tracked</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Videos Detected (24h)
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
              <Flame className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {overview?.newVideos24h ?? 0}
              </div>
            )}
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32 mt-1" />
              ) : (
                <>
                  <Badge variant="info" className="mr-1.5 py-0 px-1 text-[10px]">
                    Verified
                  </Badge>
                  <span>Discovered within last 24h</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Tracked Videos
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
              <VideoIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {overview?.totalVideosTracked ?? 0}
              </div>
            )}
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32 mt-1" />
              ) : (
                <>
                  <span className="font-medium text-foreground mr-1">
                    {formatCompactNumber(overview?.totalViews)}
                  </span>
                  <span>total recorded views</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              EchoTik GMV Recorded
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-foreground">
                ${formatCompactNumber(overview?.importedGmv)}
              </div>
            )}
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32 mt-1" />
              ) : (
                <>
                  <span className="text-emerald-600 font-medium mr-1">
                    {formatCompactNumber(overview?.importedSales)}
                  </span>
                  <span>affiliate sales logged</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Activity Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Publishing Activity Chart */}
        <Card className="lg:col-span-2 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Publishing & Detection Cadence</CardTitle>
                <CardDescription>
                  Daily discovered promotional videos across monitored TikTok Shop US creators
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Last 7 Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.length === 0 || chartData.every((c) => c.published === 0 && c.detected === 0) ? (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed rounded-md text-xs text-muted-foreground p-6 text-center">
                <VideoIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="font-medium text-foreground">No video activity recorded in the last 7 days</p>
                <p className="mt-1">Add creators or run a tracking synchronization to populate trends.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="pubGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="detGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="day"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      formatter={(val: unknown, name: unknown) => [
                        `${Number(val ?? 0)} videos`,
                        name === 'published' ? 'Published' : 'Detected',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="published"
                      stroke="#0f172a"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#pubGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="detected"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#detGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Active Creators */}
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top US Creators</CardTitle>
                <CardDescription>Ranked by 30-day video output</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                <Link to="/influencers">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-1.5">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))
            ) : topCreators.length === 0 ? (
              <div className="border border-dashed rounded-md p-6 text-center text-xs text-muted-foreground">
                No creator video data available yet.
              </div>
            ) : (
              topCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between rounded-md p-1.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={creator.avatarUrl || undefined} />
                      <AvatarFallback>
                        {creator.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-xs text-foreground truncate">
                        {creator.displayName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">
                        @{creator.username}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium text-xs text-foreground">
                      {creator.videoCountInPeriod} videos
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatCompactNumber(creator.totalViewsInPeriod)} views
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Video Activity Table */}
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Recent Video Activity</CardTitle>
              <CardDescription>
                Latest discovered TikTok Shop US promotional videos
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link to="/videos">
                Browse all videos <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Creator & Video</TableHead>
                <TableHead>Associated Shop & Product</TableHead>
                <TableHead>Published (Source)</TableHead>
                <TableHead>First Detected</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-3">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : recentVideos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                    No videos recorded in the database yet. Click "Manage Creators" to add or import creators.
                  </TableCell>
                </TableRow>
              ) : (
                recentVideos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="flex items-start gap-2.5">
                        <div className="relative h-12 w-9 rounded overflow-hidden bg-muted shrink-0 border">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-slate-200 flex items-center justify-center text-[9px] text-muted-foreground">
                              No preview
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Play className="h-3 w-3 text-white fill-white opacity-80" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-xs text-foreground truncate">
                              {video.creator?.displayName || 'Creator'}
                            </span>
                            {video.isNew && (
                              <Badge variant="success" className="text-[9px] py-0 px-1">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {video.caption || 'No caption provided'}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs">
                        <span className="font-medium text-foreground block truncate">
                          {video.product?.name ? 'Verified Product' : 'Unassigned Shop'}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {video.product?.name || 'No specific product tagged'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs">
                        <span className="text-foreground block">
                          {formatDateTime(video.publishedAt, settings.displayTimezone)}
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

                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1"
                        >
                          TikTok <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
