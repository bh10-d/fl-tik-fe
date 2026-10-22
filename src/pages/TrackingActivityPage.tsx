import React, { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  CheckCircle2,
  AlertOctagon,
  RotateCw,
  Pause,
  Play,
  Server,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useApp } from '@/context/AppContext'
import { TrackingJob, TrackingHealth } from '@/types'
import { trackingService } from '@/services/tracking.service'
import { dashboardService } from '@/services/dashboard.service'
import { influencerService } from '@/services/influencer.service'
import {
  formatDateTime,
  formatTimeAgo,
} from '@/utils/formatters'

export function TrackingActivityPage() {
  const { settings, refreshKey, triggerRefresh } = useApp()

  const [jobs, setJobs] = useState<TrackingJob[]>([])
  const [health, setHealth] = useState<TrackingHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTriggeringCrawl, setIsTriggeringCrawl] = useState(false)
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null)
  const [togglingJobId, setTogglingJobId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<TrackingJob | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [jobsData, healthData] = await Promise.all([
        trackingService.getJobs(),
        dashboardService.getTrackingHealth().catch(() => null),
      ])
      setJobs(jobsData)
      setHealth(healthData)
    } catch (err) {
      console.error('Failed to load tracking data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  // KPIs
  const totalMonitored = jobs.length
  const newVideosDetected = jobs.reduce((sum, j) => sum + (j.newVideoCount || 0), 0)
  const failedJobsCount = jobs.filter((j) => j.status?.toLowerCase() === 'failed').length
  const completedJobs = jobs.filter((j) => j.status?.toLowerCase() === 'completed')

  // Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== 'all' && job.status?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false
    }
    return true
  })

  const handleRunAllNow = async () => {
    setIsTriggeringCrawl(true)
    try {
      const activeJobs = jobs.filter((j) => j.status?.toLowerCase() !== 'paused')
      await Promise.allSettled(activeJobs.map((j) => influencerService.syncInfluencer(j.creatorId)))
      await fetchData()
      triggerRefresh()
    } catch (err) {
      console.error('Failed to trigger crawler:', err)
    } finally {
      setIsTriggeringCrawl(false)
    }
  }

  const handleRetryJob = async (job: TrackingJob) => {
    setRetryingJobId(job.id)
    try {
      await trackingService.retryJob(job.id)
      await fetchData()
      triggerRefresh()
    } catch (err) {
      console.error('Failed to retry job:', err)
    } finally {
      setRetryingJobId(null)
    }
  }

  const handleToggleJob = async (job: TrackingJob) => {
    setTogglingJobId(job.id)
    try {
      if (job.status?.toLowerCase() === 'paused') {
        await influencerService.trackInfluencer(job.creatorId)
      } else {
        await influencerService.pauseInfluencer(job.creatorId)
      }
      await fetchData()
      triggerRefresh()
    } catch (err) {
      console.error('Failed to toggle job tracking:', err)
    } finally {
      setTogglingJobId(null)
    }
  }

  const openJobHistory = (job: TrackingJob) => {
    setSelectedJobForDetail(job)
    setDetailModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Tracking Activity & Scraper Status
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Monitor automated background workers, proxy rotation status, and newly detected TikTok videos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs"
            title="Refresh tracking data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleRunAllNow}
            disabled={isTriggeringCrawl}
            className="h-8 gap-1.5 text-xs"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isTriggeringCrawl ? 'animate-spin' : ''}`} />
            {isTriggeringCrawl ? 'Triggering Workers...' : 'Run Scraper Now'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Creators Monitored
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Server className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {totalMonitored}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Active crawling routines
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Videos Newly Detected
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {newVideosDetected}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Discovered in the last 24h
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Worker Success Rate
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {health?.successRate != null ? `${health.successRate}%` : '100%'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {health?.completedRuns ?? 0} successful runs in 24h
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Failed Checks
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {failedJobsCount}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {failedJobsCount > 0 ? (
                <span className="text-destructive font-medium">{failedJobsCount} worker(s) failed</span>
              ) : (
                'All workers healthy'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="shadow-none">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status Filter:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All Worker Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses ({jobs.length})</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="failed">Failed ({failedJobsCount})</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground">
            Scraper polling interval: <span className="font-medium text-foreground">{settings.autoRefreshInterval} mins</span>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator Monitored</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead>Latest Published Video</TableHead>
                <TableHead>Latest Detected</TableHead>
                <TableHead className="text-center">New Videos</TableHead>
                <TableHead>Worker Status</TableHead>
                <TableHead>Next Scheduled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Loading tracking tasks from BullMQ worker queue...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    No tracking jobs match the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => {
                  const statusNormalized = job.status?.toLowerCase()
                  const isRetrying = retryingJobId === job.id
                  const isToggling = togglingJobId === job.id

                  const statusVariant =
                    statusNormalized === 'completed'
                      ? 'success'
                      : statusNormalized === 'running'
                      ? 'info'
                      : statusNormalized === 'failed'
                      ? 'destructive'
                      : 'secondary'

                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={job.creatorAvatarUrl} />
                            <AvatarFallback>
                              {job.creatorDisplayName ? job.creatorDisplayName.slice(0, 2).toUpperCase() : 'CR'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-xs text-foreground truncate">
                              {job.creatorDisplayName}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              @{job.creatorUsername}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs">
                          <span className="text-foreground block">
                            {formatDateTime(job.lastCheckedAt, settings.displayTimezone)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTimeAgo(job.lastCheckedAt)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {job.latestPublishedAt ? (
                          <div className="text-xs">
                            <span className="text-foreground block">
                              {formatDateTime(job.latestPublishedAt, settings.displayTimezone)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimeAgo(job.latestPublishedAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No videos yet</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {job.latestDetectedAt ? (
                          <div className="text-xs">
                            <span className="text-foreground block">
                              {formatDateTime(job.latestDetectedAt, settings.displayTimezone)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimeAgo(job.latestDetectedAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={job.newVideoCount > 0 ? 'secondary' : 'outline'}
                          className={`text-[10px] font-mono ${
                            job.newVideoCount > 0 ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300' : ''
                          }`}
                        >
                          +{job.newVideoCount}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusVariant} className="capitalize text-[10px]">
                          {job.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatTimeAgo(job.nextScheduledAt)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {statusNormalized === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleRetryJob(job)}
                              disabled={isRetrying}
                            >
                              {isRetrying ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <RotateCw className="h-3 w-3 mr-1" />
                              )}
                              Retry
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleToggleJob(job)}
                            disabled={isToggling}
                            title={statusNormalized === 'paused' ? 'Resume tracking' : 'Pause tracking'}
                          >
                            {statusNormalized === 'paused' ? (
                              <Play className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Pause className="h-3.5 w-3.5 text-amber-600" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => openJobHistory(job)}
                          >
                            Details
                          </Button>
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

      {/* Job Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Worker Task Details</DialogTitle>
            <DialogDescription>
              Inspection of crawler execution and proxy metrics.
            </DialogDescription>
          </DialogHeader>

          {selectedJobForDetail && (
            <div className="space-y-3 py-2 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/40">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={selectedJobForDetail.creatorAvatarUrl} />
                  <AvatarFallback>
                    {selectedJobForDetail.creatorDisplayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground text-xs">
                    {selectedJobForDetail.creatorDisplayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    @{selectedJobForDetail.creatorUsername}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border p-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Job ID
                  </span>
                  <span className="font-mono text-xs truncate block">
                    {selectedJobForDetail.id}
                  </span>
                </div>
                <div className="rounded-md border p-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Current Status
                  </span>
                  <Badge variant="outline" className="text-[10px] capitalize mt-0.5">
                    {selectedJobForDetail.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5 rounded-md border p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Crawl Timestamp:</span>
                  <span className="font-mono">
                    {formatDateTime(selectedJobForDetail.lastCheckedAt, settings.displayTimezone)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Scheduled Run:</span>
                  <span className="font-mono">
                    {formatDateTime(selectedJobForDetail.nextScheduledAt, settings.displayTimezone)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discovered In Run:</span>
                  <span className="font-mono font-bold">
                    {selectedJobForDetail.newVideoCount} videos
                  </span>
                </div>
              </div>

              {selectedJobForDetail.failureReason && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-destructive text-[11px]">
                  <p className="font-semibold">Worker Failure Reason:</p>
                  <p className="mt-0.5">{selectedJobForDetail.failureReason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
