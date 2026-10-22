import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
  CalendarX,
  Clock,
  Trash2,
  PauseCircle,
  Filter,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import {
  influencerService,
  DormantSummary,
  DormantInfluencerItem,
} from '@/services/influencer.service'
import { formatCompactNumber, formatDate, formatTimeAgo } from '@/utils/formatters'
import { useApp } from '@/context/AppContext'

interface DormantAccountsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyFilter?: (filterKey: string) => void
  onSuccess?: () => void
}

export function DormantAccountsDialog({
  open,
  onOpenChange,
  onApplyFilter,
  onSuccess,
}: DormantAccountsDialogProps) {
  const { settings, triggerRefresh } = useApp()
  const [thresholdDays, setThresholdDays] = useState('180')
  const [summary, setSummary] = useState<DormantSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isActionPending, setIsActionPending] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const fetchDormant = useCallback(async () => {
    setIsLoading(true)
    setActionMessage(null)
    try {
      const days = parseInt(thresholdDays, 10) || 180
      const data = await influencerService.getDormantSummary(days)
      setSummary(data)
      // Auto-select all by default for easy review & batch action
      setSelectedIds(data.dormantInfluencers.map((i) => i.id))
    } catch (err) {
      console.error('Failed to load dormant summary:', err)
    } finally {
      setIsLoading(false)
    }
  }, [thresholdDays])

  useEffect(() => {
    if (open) {
      fetchDormant()
    }
  }, [open, fetchDormant])

  const handleSelectAll = (checked: boolean) => {
    if (checked && summary) {
      setSelectedIds(summary.dormantInfluencers.map((i) => i.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleApplyFilterToTable = () => {
    const filterKey =
      thresholdDays === '180'
        ? 'dormant_180d'
        : thresholdDays === '90'
        ? 'dormant_90d'
        : thresholdDays === '60'
        ? 'dormant_60d'
        : 'dormant_30d'

    onApplyFilter?.(filterKey)
    onOpenChange(false)
  }

  const handleBulkPause = async () => {
    if (selectedIds.length === 0) return
    setIsActionPending(true)
    try {
      await influencerService.bulkPause(selectedIds)
      setActionMessage(`Successfully paused tracking for ${selectedIds.length} accounts.`)
      triggerRefresh()
      onSuccess?.()
      await fetchDormant()
    } catch (err: any) {
      alert(err.message || 'Failed to pause dormant accounts')
    } finally {
      setIsActionPending(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${selectedIds.length} dormant creator(s)? This will remove all their videos and metrics.`
    )
    if (!confirmed) return

    setIsActionPending(true)
    try {
      await influencerService.bulkDelete(selectedIds)
      setActionMessage(`Successfully deleted ${selectedIds.length} dormant accounts.`)
      triggerRefresh()
      onSuccess?.()
      await fetchDormant()
    } catch (err: any) {
      alert(err.message || 'Failed to delete dormant accounts')
    } finally {
      setIsActionPending(false)
    }
  }

  const dormantList = summary?.dormantInfluencers || []
  const allSelected = dormantList.length > 0 && selectedIds.length === dormantList.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarX className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Dormant & Inactive Creators Detector
              </DialogTitle>
              <DialogDescription className="text-xs">
                Identify accounts whose latest video publication date is too old or inactive.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Inactivity Threshold Selector & Stats */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">Inactivity Threshold:</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={thresholdDays} onValueChange={setThresholdDays} disabled={isLoading}>
                <SelectTrigger className="h-8 w-44 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="180">&gt; 180 Days (~6 Months)</SelectItem>
                  <SelectItem value="90">&gt; 90 Days (~3 Months)</SelectItem>
                  <SelectItem value="60">&gt; 60 Days (~2 Months)</SelectItem>
                  <SelectItem value="30">&gt; 30 Days (~1 Month)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={fetchDormant}
                disabled={isLoading}
                title="Re-scan"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Metric Summary Banner */}
          {summary && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md border p-2 bg-card">
                <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                  Dormant Accounts
                </span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {summary.dormantCount}
                </span>
              </div>
              <div className="rounded-md border p-2 bg-card">
                <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                  No Videos Tracked
                </span>
                <span className="text-sm font-bold text-muted-foreground">
                  {summary.noVideosCount}
                </span>
              </div>
              <div className="rounded-md border p-2 bg-card">
                <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                  Total Inactive
                </span>
                <span className="text-sm font-bold text-foreground">
                  {summary.totalInactive}
                </span>
              </div>
            </div>
          )}

          {actionMessage && (
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs text-emerald-800 dark:text-emerald-300">
              {actionMessage}
            </div>
          )}
        </div>

        {/* Accounts List Table / Box */}
        <div className="flex-1 min-h-[220px] max-h-[320px] overflow-y-auto rounded-md border mt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Scanning video timelines...</span>
            </div>
          ) : dormantList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-1.5 text-xs text-muted-foreground p-6 text-center">
              <AlertTriangle className="h-5 w-5 text-muted-foreground/60" />
              <span className="font-medium text-foreground">No dormant creators found</span>
              <span className="text-[11px]">
                All monitored creators with videos have published content within the last {thresholdDays} days.
              </span>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between p-2.5 bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0 bg-background z-10 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox checked={allSelected} onCheckedChange={(c) => handleSelectAll(Boolean(c))} />
                  <span>Select All ({dormantList.length})</span>
                </div>
                <span>{selectedIds.length} selected</span>
              </div>

              {dormantList.map((creator) => {
                const isChecked = selectedIds.includes(creator.id)
                return (
                  <div
                    key={creator.id}
                    className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/30 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(c) => handleToggleSelectOne(creator.id, Boolean(c))}
                      />
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={creator.avatarUrl || undefined} />
                        <AvatarFallback>
                          {creator.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {creator.displayName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate font-mono">
                          @{creator.username}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
                        {formatTimeAgo(creator.latestPublishedAt)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatDate(creator.latestPublishedAt, settings.displayTimezone)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyFilterToTable}
            className="h-8 text-xs gap-1.5 w-full sm:w-auto"
            title="Filter these dormant accounts in the main table"
          >
            <Filter className="h-3.5 w-3.5" />
            Apply Filter in Table
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={selectedIds.length === 0 || isActionPending}
              onClick={handleBulkPause}
              className="h-8 text-xs gap-1.5"
            >
              <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
              Pause Selected ({selectedIds.length})
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={selectedIds.length === 0 || isActionPending}
              onClick={handleBulkDelete}
              className="h-8 text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected ({selectedIds.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

