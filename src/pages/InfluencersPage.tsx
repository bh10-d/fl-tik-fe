import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Upload,
  Download,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Trash2,
  ExternalLink,
  Eye,
  RefreshCw,
  Loader2,
  RotateCw,
  CalendarX,
  Clock,
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
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useApp } from '@/context/AppContext'
import { useDebounce } from '@/hooks/useDebounce'
import { Influencer, PaginationMeta } from '@/types'
import { influencerService, QueryInfluencersParams } from '@/services/influencer.service'
import {
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatTimeAgo,
  exportToCSV,
} from '@/utils/formatters'
import { InfluencerDetailSheet } from '@/components/influencers/InfluencerDetailSheet'
import { AddInfluencerDialog } from '@/components/influencers/AddInfluencerDialog'
import { ImportCsvDialog } from '@/components/influencers/ImportCsvDialog'
import { DormantAccountsDialog } from '@/components/influencers/DormantAccountsDialog'
import { DataTablePagination } from '@/components/common/DataTablePagination'

const PRESET_CATEGORIES = [
  'Beauty & Personal Care',
  'Beauty & Skincare',
  'Fashion & Apparel',
  'Electronics & Tech',
  'Home & Kitchen',
  'Health & Fitness',
  'Food & Cooking',
  'Collectibles & Toys',
  'General',
]

export function InfluencersPage() {
  const { settings, refreshKey, triggerRefresh } = useApp()

  // Local state
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null)
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [followerFilter, setFollowerFilter] = useState('all')
  const [lastVideoFilter, setLastVideoFilter] = useState('all')
  const [sortBy, setSortBy] = useState<string>('followers')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals & Sheets
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [dormantDialogOpen, setDormantDialogOpen] = useState(false)

  // Fetch influencers from backend
  const fetchInfluencers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: QueryInfluencersParams = {
        page: currentPage,
        limit: pageSize,
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }

      if (categoryFilter !== 'all') {
        params.category = categoryFilter
      }

      if (statusFilter !== 'all') {
        params.trackingStatus = statusFilter
      }

      if (lastVideoFilter !== 'all') {
        params.lastVideoFilter = lastVideoFilter
      }

      if (followerFilter === 'under500k') {
        params.maxFollowers = 500000
      } else if (followerFilter === '500k-1m') {
        params.minFollowers = 500000
        params.maxFollowers = 1000000
      } else if (followerFilter === 'over1m') {
        params.minFollowers = 1000000
      }

      if (sortBy === 'followers') {
        params.sortBy = 'followers'
        params.sortOrder = 'desc'
      } else if (sortBy === 'activity') {
        params.sortBy = 'lastCheckedAt'
        params.sortOrder = 'desc'
      } else if (sortBy === 'createdAt') {
        params.sortBy = 'createdAt'
        params.sortOrder = 'desc'
      }

      const res = await influencerService.getInfluencers(params)
      setInfluencers(res.data)
      setPaginationMeta(res.meta)
    } catch (err) {
      console.error('Failed to load influencers:', err)
    } finally {
      setIsLoading(false)
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    categoryFilter,
    statusFilter,
    followerFilter,
    lastVideoFilter,
    sortBy,
  ])

  useEffect(() => {
    fetchInfluencers()
  }, [fetchInfluencers, refreshKey])

  // Reset page when filter changes
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleFollowerChange = (value: string) => {
    setFollowerFilter(value)
    setCurrentPage(1)
  }

  const handleLastVideoChange = (value: string) => {
    setLastVideoFilter(value)
    setCurrentPage(1)
  }

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(influencers.map((i) => i.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleBulkPause = async () => {
    if (selectedIds.length === 0) return
    setIsBulkActionLoading(true)
    try {
      await influencerService.bulkPause(selectedIds)
      setSelectedIds([])
      await fetchInfluencers()
      triggerRefresh()
    } catch (err) {
      console.error('Bulk pause error:', err)
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const handleBulkResume = async () => {
    if (selectedIds.length === 0) return
    setIsBulkActionLoading(true)
    try {
      await influencerService.bulkTrack(selectedIds)
      setSelectedIds([])
      await fetchInfluencers()
      triggerRefresh()
    } catch (err) {
      console.error('Bulk track error:', err)
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const confirmMsg = `Are you sure you want to remove ${selectedIds.length} creator(s)? All their associated tracking records will be deleted.`
    if (!window.confirm(confirmMsg)) return

    setIsBulkActionLoading(true)
    try {
      await influencerService.bulkDelete(selectedIds)
      setSelectedIds([])
      await fetchInfluencers()
      triggerRefresh()
    } catch (err) {
      console.error('Bulk delete error:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete selected creators')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const handleToggleStatus = async (inf: Influencer) => {
    setActionInProgressId(inf.id)
    try {
      if (inf.trackingStatus?.toUpperCase() === 'ACTIVE') {
        await influencerService.pauseInfluencer(inf.id)
      } else {
        await influencerService.trackInfluencer(inf.id)
      }
      fetchInfluencers()
      triggerRefresh()
    } catch (err) {
      console.error('Toggle status error:', err)
    } finally {
      setActionInProgressId(null)
    }
  }

  const handleSyncCreator = async (inf: Influencer) => {
    setActionInProgressId(inf.id)
    try {
      await influencerService.syncInfluencer(inf.id)
      await fetchInfluencers()
      triggerRefresh()
    } catch (err) {
      console.error('Sync creator error:', err)
    } finally {
      setActionInProgressId(null)
    }
  }

  const handleDeleteCreator = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this creator from tracking?')) return
    setActionInProgressId(id)
    try {
      await influencerService.deleteInfluencer(id)
      setSelectedIds((prev) => prev.filter((item) => item !== id))
      fetchInfluencers()
      triggerRefresh()
    } catch (err) {
      console.error('Delete creator error:', err)
    } finally {
      setActionInProgressId(null)
    }
  }

  const handleExport = () => {
    const rows = influencers.map((inf) => {
      return {
        username: inf.username,
        displayName: inf.displayName,
        followers: inf.followers != null ? inf.followers : '',
        category: inf.category || '',
        trackingStatus: inf.trackingStatus,
        videosCount: inf.videoCount ?? 0,
        profileUrl: inf.profileUrl,
        lastCheckedAt: inf.lastCheckedAt || '',
      }
    })

    exportToCSV('tiktok_shop_us_influencers.csv', rows, [
      { key: 'username', label: 'Username' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'followers', label: 'Followers' },
      { key: 'category', label: 'Category' },
      { key: 'trackingStatus', label: 'Status' },
      { key: 'videosCount', label: 'Tracked Videos' },
      { key: 'profileUrl', label: 'Profile URL' },
      { key: 'lastCheckedAt', label: 'Last Checked (UTC)' },
    ])
  }

  const openDetails = (creator: Influencer) => {
    setSelectedInfluencer(creator)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Monitored Influencers
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage creator roster, automated crawling schedules, and tracked content.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchInfluencers}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs"
            title="Refresh list"
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
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Upload className="h-3.5 w-3.5" /> Import CSV / Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDormantDialogOpen(true)}
            className="h-8 gap-1.5 text-xs text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            title="Scan and clean up dormant or inactive creators"
          >
            <CalendarX className="h-3.5 w-3.5" /> Check Dormant Accounts
          </Button>
          <Button
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Add Influencer
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="shadow-none">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search username or name..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PRESET_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tracking Status */}
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="provider_unavailable">Provider Unavailable</SelectItem>
                <SelectItem value="error">Error / Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Last Video Activity */}
            <Select value={lastVideoFilter} onValueChange={handleLastVideoChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Video Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Video Activity</SelectItem>
                <SelectItem value="recent_30d">Active Recently (&lt; 30d)</SelectItem>
                <SelectItem value="dormant_30d">Inactive &gt; 30 days</SelectItem>
                <SelectItem value="dormant_60d">Inactive &gt; 60 days</SelectItem>
                <SelectItem value="dormant_90d">Inactive &gt; 90 days (3 mos)</SelectItem>
                <SelectItem value="dormant_180d">Dormant &gt; 180 days (6 mos)</SelectItem>
                <SelectItem value="no_videos">No Videos Tracked</SelectItem>
              </SelectContent>
            </Select>

            {/* Follower Range */}
            <Select value={followerFilter} onValueChange={handleFollowerChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Followers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Follower Sizes</SelectItem>
                <SelectItem value="under500k">&lt; 500K followers</SelectItem>
                <SelectItem value="500k-1m">500K - 1M followers</SelectItem>
                <SelectItem value="over1m">&gt; 1M followers</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="followers">Sort by Followers</SelectItem>
                <SelectItem value="activity">Sort by Recent Check</SelectItem>
                <SelectItem value="createdAt">Sort by Date Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-1.5 text-xs">
              <span className="font-medium text-foreground">
                {selectedIds.length} creators selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleBulkResume}
                  disabled={isBulkActionLoading}
                >
                  <PlayCircle className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                  Resume Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleBulkPause}
                  disabled={isBulkActionLoading}
                >
                  <PauseCircle className="mr-1 h-3.5 w-3.5 text-amber-600" />
                  Pause Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={handleBulkDelete}
                  disabled={isBulkActionLoading}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setSelectedIds([])}
                  disabled={isBulkActionLoading}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table className={isLoading && influencers.length > 0 ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      influencers.length > 0 &&
                      influencers.every((i) => selectedIds.includes(i.id))
                    }
                    onCheckedChange={(c) => handleSelectAll(Boolean(c))}
                  />
                </TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Followers</TableHead>
                <TableHead className="text-center">Videos Tracked</TableHead>
                <TableHead>Latest Video</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && influencers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Loading creators from database...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : influencers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                    No influencers found matching your current filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                influencers.map((inf) => {
                  const isSelected = selectedIds.includes(inf.id)
                  const isActioning = actionInProgressId === inf.id
                  const statusNormalized = inf.trackingStatus?.toUpperCase()

                  const statusVariant =
                    statusNormalized === 'ACTIVE'
                      ? 'success'
                      : statusNormalized === 'PAUSED'
                      ? 'secondary'
                      : statusNormalized === 'PROVIDER_UNAVAILABLE'
                      ? 'warning'
                      : 'destructive'

                  return (
                    <TableRow key={inf.id} data-state={isSelected ? 'selected' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(c) => handleSelectOne(inf.id, Boolean(c))}
                        />
                      </TableCell>

                      <TableCell>
                        <div
                          className="flex items-center gap-2.5 cursor-pointer"
                          onClick={() => openDetails(inf)}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={inf.avatarUrl || undefined} />
                            <AvatarFallback>
                              {inf.displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-xs text-foreground hover:underline truncate">
                              {inf.displayName}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              @{inf.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {inf.category || 'General'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs">
                        {inf.followers != null ? formatCompactNumber(inf.followers) : '—'}
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs">
                        <Badge variant="secondary" className="text-[10px]">
                          {inf.videoCount ?? 0}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {inf.latestPublishedAt ? (
                          <div className="text-xs">
                            <span className="text-foreground block font-medium">
                              {formatDate(inf.latestPublishedAt, settings.displayTimezone)}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground">
                                {formatTimeAgo(inf.latestPublishedAt)}
                              </span>
                              {(() => {
                                const pubTime = new Date(inf.latestPublishedAt).getTime()
                                if (isNaN(pubTime)) return null
                                const days = Math.floor(
                                  (Date.now() - pubTime) / (1000 * 60 * 60 * 24)
                                )
                                if (days >= 180) {
                                  return (
                                    <Badge
                                      variant="destructive"
                                      className="text-[9px] px-1 py-0"
                                      title={`Last video ${days} days ago (>6 months)`}
                                    >
                                      Dormant &gt;6m
                                    </Badge>
                                  )
                                }
                                if (days >= 90) {
                                  return (
                                    <Badge
                                      variant="warning"
                                      className="text-[9px] px-1 py-0"
                                      title={`Last video ${days} days ago (>3 months)`}
                                    >
                                      Inactive &gt;3m
                                    </Badge>
                                  )
                                }
                                return null
                              })()}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            No Videos
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {inf.lastCheckedAt ? (
                          <div className="text-xs">
                            <span className="text-foreground block">
                              {formatDateTime(inf.lastCheckedAt, settings.displayTimezone)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimeAgo(inf.lastCheckedAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Never</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusVariant} className="text-[11px] whitespace-nowrap">
                          {statusNormalized === 'PROVIDER_UNAVAILABLE'
                            ? 'Provider Unavailable'
                            : inf.trackingStatus}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={isActioning}
                            >
                              {isActioning ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openDetails(inf)}>
                              <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSyncCreator(inf)}>
                              <RotateCw className="mr-2 h-3.5 w-3.5 text-blue-600" /> Sync Now
                            </DropdownMenuItem>
                            {inf.profileUrl && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={inf.profileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center"
                                >
                                  <ExternalLink className="mr-2 h-3.5 w-3.5" /> TikTok Profile
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(inf)}>
                              {statusNormalized === 'ACTIVE' ? (
                                <>
                                  <PauseCircle className="mr-2 h-3.5 w-3.5 text-amber-600" />
                                  Pause Tracking
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                                  Resume Tracking
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteCreator(inf.id)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove Creator
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Enhanced Pagination Bar */}
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
            pageSizeOptions={[10, 20, 50, 100]}
            selectedCount={selectedIds.length}
            itemLabel="creators"
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Sheets & Dialogs */}
      <InfluencerDetailSheet
        influencerId={selectedInfluencer?.id || null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdated={fetchInfluencers}
      />
      <AddInfluencerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchInfluencers}
      />
      <ImportCsvDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchInfluencers}
      />
      <DormantAccountsDialog
        open={dormantDialogOpen}
        onOpenChange={setDormantDialogOpen}
        onApplyFilter={(val) => {
          setLastVideoFilter(val)
          setCurrentPage(1)
        }}
        onSuccess={fetchInfluencers}
      />
    </div>
  )
}
