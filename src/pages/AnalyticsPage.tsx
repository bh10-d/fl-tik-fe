import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useApp } from '@/context/AppContext'
import { Video, Influencer, Shop, PublishingTrend, ActiveCreator } from '@/types'
import { SearchableSelect, SearchableOption } from '@/components/common/SearchableSelect'
import { dashboardService } from '@/services/dashboard.service'
import { videoService } from '@/services/video.service'
import { influencerService } from '@/services/influencer.service'
import { shopService } from '@/services/shop.service'
import {
  formatCompactNumber,
  formatDate,
  exportToCSV,
} from '@/utils/formatters'

export function AnalyticsPage() {
  const { settings, refreshKey } = useApp()

  // Filters
  const [dateRangeFilter, setDateRangeFilter] = useState<'7d' | '30d' | '90d'>('7d')
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [shopFilter, setShopFilter] = useState('all')

  // Data states
  const [publishingTrends, setPublishingTrends] = useState<PublishingTrend[]>([])
  const [activeCreators, setActiveCreators] = useState<ActiveCreator[]>([])
  const [topVideos, setTopVideos] = useState<Video[]>([])
  const [creatorsList, setCreatorsList] = useState<Influencer[]>([])
  const [shopsList, setShopsList] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load dropdown lists
  useEffect(() => {
    influencerService
      .getInfluencers({ limit: 100 })
      .then((res) => setCreatorsList(res.data))
      .catch((err) => console.error('Failed to load influencers:', err))

    shopService
      .getShops()
      .then((data) => setShopsList(data))
      .catch((err) => console.error('Failed to load shops:', err))
  }, [])

  // Load analytics data
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const days = dateRangeFilter === '7d' ? 7 : dateRangeFilter === '30d' ? 30 : 90
      const [trends, creators, videosRes] = await Promise.all([
        dashboardService.getPublishingTrends(days).catch(() => []),
        dashboardService.getMostActiveCreators(days, 8).catch(() => []),
        videoService.getVideos({
          sortBy: 'views',
          sortOrder: 'desc',
          limit: 10,
          creatorId: creatorFilter !== 'all' ? creatorFilter : undefined,
          shopId: shopFilter !== 'all' ? shopFilter : undefined,
        }),
      ])

      setPublishingTrends(trends)
      setActiveCreators(creators)
      setTopVideos(videosRes.data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [dateRangeFilter, creatorFilter, shopFilter])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics, refreshKey])

  // Searchable select options
  const creatorOptions = useMemo<SearchableOption[]>(() => {
    return creatorsList.map((c) => ({
      value: c.id,
      label: c.displayName,
      subLabel: `@${c.username}`,
      avatarUrl: c.avatarUrl,
    }))
  }, [creatorsList])

  const shopOptions = useMemo<SearchableOption[]>(() => {
    return shopsList.map((s) => ({
      value: s.id,
      label: s.name,
      subLabel: s.market ? `Market: ${s.market}` : undefined,
    }))
  }, [shopsList])

  // Chart 1: Publishing Cadence formatted
  const publishedTrendsData = useMemo(() => {
    return publishingTrends.map((t) => {
      const parts = t.date.split('-')
      const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : t.date
      return {
        date: label,
        published: t.publishedCount,
        detected: t.detectedCount,
      }
    })
  }, [publishingTrends])

  // Chart 2: Creator Activity Comparison
  const creatorActivityData = useMemo(() => {
    return activeCreators.slice(0, 6).map((c) => ({
      name: c.displayName.split(' ')[0],
      fullName: c.displayName,
      videos: c.videoCountInPeriod,
      views: Math.round(c.totalViewsInPeriod / 1000), // In thousands
    }))
  }, [activeCreators])

  // Chart 3: Hourly distribution calculated from loaded top videos
  const hourlyDistribution = useMemo(() => {
    const hours: Record<number, number> = {}
    for (let i = 0; i < 24; i += 2) {
      hours[i] = 0
    }
    topVideos.forEach((v) => {
      const d = new Date(v.publishedAt)
      if (!isNaN(d.getTime())) {
        const h = Math.floor(d.getUTCHours() / 2) * 2
        hours[h] = (hours[h] || 0) + 1
      }
    })
    return Object.entries(hours).map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      count,
    }))
  }, [topVideos])

  // CSV Export
  const handleExport = () => {
    const rows = topVideos.map((v) => ({
      id: v.id,
      creator: v.creator?.displayName || '',
      username: v.creator?.username || '',
      shop: v.product?.shop?.name || '',
      product: v.product?.name || '',
      caption: v.caption || '',
      publishedAt: v.publishedAt,
      views: v.views || 0,
      likes: v.likes || 0,
      comments: v.comments || 0,
      shares: v.shares || 0,
    }))

    exportToCSV('tiktok_shop_us_analytics.csv', rows, [
      { key: 'id', label: 'Video ID' },
      { key: 'creator', label: 'Creator' },
      { key: 'username', label: 'Username' },
      { key: 'shop', label: 'Shop Placement' },
      { key: 'product', label: 'Tagged Product' },
      { key: 'caption', label: 'Caption' },
      { key: 'publishedAt', label: 'Published (UTC)' },
      { key: 'views', label: 'Views' },
      { key: 'likes', label: 'Likes' },
      { key: 'comments', label: 'Comments' },
      { key: 'shares', label: 'Shares' },
    ])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            TikTok Shop US Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Aggregate publishing cadence, creator activity volume, and video performance trends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs"
            title="Refresh analytics data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="h-8 gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" /> Export Analytics CSV
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {/* Date Range */}
            <Select
              value={dateRangeFilter}
              onValueChange={(val: '7d' | '30d' | '90d') => setDateRangeFilter(val)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Creator Filter with Search */}
            <SearchableSelect
              value={creatorFilter}
              onValueChange={setCreatorFilter}
              options={creatorOptions}
              placeholder="All Creators"
              searchPlaceholder="Search creator name or @username..."
              emptyText="No creators found"
              allOptionLabel="All Monitored Creators"
            />

            {/* Shop Filter with Search */}
            <SearchableSelect
              value={shopFilter}
              onValueChange={setShopFilter}
              options={shopOptions}
              placeholder="All Shops"
              searchPlaceholder="Search brand / shop name..."
              emptyText="No shops found"
              allOptionLabel="All Brands & Shops"
            />
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Publishing Cadence Over Time */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Videos Published & Detected Over Time</CardTitle>
            <CardDescription>
              Daily volume of discovered promotional videos vs detected date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading publishing cadence...</span>
              </div>
            ) : publishedTrendsData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                No publishing trends recorded in this period.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={publishedTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="stroke-muted/30" />
                    <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} />
                    <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="published" name="Published Videos" fill="#0f172a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="detected" name="Newly Detected" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Creator Activity Comparison */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Creator Video Output Comparison</CardTitle>
            <CardDescription>Number of tracked videos per top creator</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading creator output stats...</span>
              </div>
            ) : creatorActivityData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                No active creator records available.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={creatorActivityData}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="stroke-muted/30" />
                    <XAxis type="number" stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} allowDecimals={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="currentColor"
                      className="text-muted-foreground"
                      fontSize={11}
                      tickLine={false}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'hsl(var(--foreground))',
                      }}
                      formatter={(val: unknown) => [`${Number(val ?? 0)} videos`, 'Output']}
                    />
                    <Bar dataKey="videos" name="Video Output" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Publishing Time Distribution (Hours UTC) */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Publishing Time Distribution (UTC)</CardTitle>
            <CardDescription>Peak posting hours for TikTok Shop US creators</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading hourly distribution...</span>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="stroke-muted/30" />
                    <XAxis dataKey="hour" stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} />
                    <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'hsl(var(--foreground))',
                      }}
                      formatter={(val: unknown) => [`${Number(val ?? 0)} videos posted`, 'Volume']}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Videos Posted"
                      stroke="#0f172a"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Creator Views Distribution */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Creator Total Views (in Thousands)</CardTitle>
            <CardDescription>Total view accumulation across top US creators in period</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading view stats...</span>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creatorActivityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="stroke-muted/30" />
                    <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} />
                    <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}K`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'hsl(var(--foreground))',
                      }}
                      formatter={(val: unknown) => [`${Number(val ?? 0).toLocaleString()}K views`, 'Total Views']}
                    />
                    <Bar dataKey="views" name="Views (K)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Best Performing Videos Table */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Best-Performing Campaign Videos</CardTitle>
          <CardDescription>
            Ranked by database view counts and real engagement velocity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Rank</TableHead>
                <TableHead>Video & Creator</TableHead>
                <TableHead>Shop Placement</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Likes</TableHead>
                <TableHead className="text-right">Comments</TableHead>
                <TableHead className="text-right">Shares</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Loading top videos from database...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : topVideos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    No videos found.
                  </TableCell>
                </TableRow>
              ) : (
                topVideos.map((video, idx) => {
                  const creator = video.creator
                  const product = video.product

                  return (
                    <TableRow key={video.id}>
                      <TableCell className="text-center font-bold text-xs text-muted-foreground font-mono">
                        #{idx + 1}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={creator?.avatarUrl || undefined} />
                            <AvatarFallback>
                              {creator?.displayName ? creator.displayName.slice(0, 2).toUpperCase() : 'CR'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-xs text-foreground truncate">
                              {creator?.displayName || 'Unknown Creator'}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {video.caption || 'No caption'}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs font-medium text-foreground">
                          {product?.shop?.name || 'Unassigned'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-foreground">
                          {formatDate(video.publishedAt, settings.displayTimezone)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                        {formatCompactNumber(video.views)}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {formatCompactNumber(video.likes)}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {formatCompactNumber(video.comments)}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {formatCompactNumber(video.shares)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
