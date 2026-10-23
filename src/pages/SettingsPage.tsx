import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Globe,
  Bell,
  Table as TableIcon,
  Save,
  CheckCircle2,
  ShieldCheck,
  Sliders,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/context/AppContext'
import { UserSettings } from '@/types'
import { dataSourcesService } from '@/services/data-sources.service'
import { DataSourcesPage } from './DataSourcesPage'

export function SettingsPage() {
  const { settings, updateSettings } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') === 'proxy' ? 'proxy' : 'general'

  const [formData, setFormData] = useState<UserSettings>(settings)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingBackendPolicy, setIsLoadingBackendPolicy] = useState(false)

  // Load backend crawl interval policy
  useEffect(() => {
    let isMounted = true
    setIsLoadingBackendPolicy(true)
    dataSourcesService
      .getAll()
      .then((res: any) => {
        if (isMounted && res?.collectionPolicy?.pollIntervalMinutes) {
          setFormData((prev) => ({
            ...prev,
            autoRefreshInterval: res.collectionPolicy.pollIntervalMinutes,
          }))
        }
      })
      .catch((err: any) => {
        console.warn('Could not fetch backend collection policy:', err?.message || err)
      })
      .finally(() => {
        if (isMounted) setIsLoadingBackendPolicy(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const handleTabChange = (val: string) => {
    setSearchParams(val === 'general' ? {} : { tab: val }, { replace: true })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      // 1. Persist directly to backend database & crawler scheduler
      await dataSourcesService.updateCollectionPolicy({
        pollIntervalMinutes: Number(formData.autoRefreshInterval),
      })
      // 2. Persist local user preferences
      updateSettings(formData)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err: any) {
      alert(`Failed to save crawler settings to server: ${err?.message || err}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure display preferences, crawler infrastructure, US residential proxy, and notification alerts.
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-9">
          <TabsTrigger value="general" className="gap-2 text-xs">
            <Sliders className="h-3.5 w-3.5" /> General Preferences
          </TabsTrigger>
          <TabsTrigger value="proxy" className="gap-2 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> Data Sources & Proxy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 m-0 focus-visible:outline-none">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Localization & Timezone */}
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <CardTitle>Timezone & Date Display</CardTitle>
                </div>
                <CardDescription>
                  Control how dates and publication timestamps are rendered across the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="displayTimezone">Display Timezone</Label>
                    <Select
                      value={formData.displayTimezone}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, displayTimezone: val }))
                      }
                    >
                      <SelectTrigger id="displayTimezone" className="h-9 text-xs">
                        <SelectValue placeholder="Select Timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Ho_Chi_Minh">Vietnam Time (ICT / GMT+7)</SelectItem>
                        <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET / New York)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT / Chicago)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT / Los Angeles)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT / BST)</SelectItem>
                        <SelectItem value="Asia/Bangkok">Indochina Time (ICT / Bangkok)</SelectItem>
                        <SelectItem value="Asia/Singapore">Singapore Time (SGT / GMT+8)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Japan Time (JST / GMT+9)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Timestamps are always captured in UTC and rendered in your chosen timezone.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="defaultDateRange">Default Date Range</Label>
                    <Select
                      value={formData.defaultDateRange}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, defaultDateRange: val }))
                      }
                    >
                      <SelectTrigger id="defaultDateRange" className="h-9 text-xs">
                        <SelectValue placeholder="Select Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="90d">Last 90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Default timeframe applied when visiting analytics and video feed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Display & Density Preferences */}
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4 text-primary" />
                  <CardTitle>Interface & Table Density</CardTitle>
                </div>
                <CardDescription>
                  Customize table padding and viewing theme.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Table Row Density</Label>
                  <RadioGroup
                    value={formData.tableDensity}
                    onValueChange={(val: 'compact' | 'normal' | 'comfortable') =>
                      setFormData((prev) => ({ ...prev, tableDensity: val }))
                    }
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted/40">
                      <RadioGroupItem value="compact" id="compact" />
                      <Label htmlFor="compact" className="cursor-pointer">
                        <span className="font-semibold block text-xs">Compact</span>
                        <span className="text-[11px] text-muted-foreground">Dense rows for analytics scanning</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted/40">
                      <RadioGroupItem value="normal" id="normal" />
                      <Label htmlFor="normal" className="cursor-pointer">
                        <span className="font-semibold block text-xs">Normal</span>
                        <span className="text-[11px] text-muted-foreground">Standard shadcn table spacing</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted/40">
                      <RadioGroupItem value="comfortable" id="comfortable" />
                      <Label htmlFor="comfortable" className="cursor-pointer">
                        <span className="font-semibold block text-xs">Comfortable</span>
                        <span className="text-[11px] text-muted-foreground">Spacious layout for touch screens</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label>Theme Preference</Label>
                  <RadioGroup
                    value={formData.themePreference}
                    onValueChange={(val: 'light' | 'system') =>
                      setFormData((prev) => ({ ...prev, themePreference: val }))
                    }
                    className="flex items-center gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="theme-light" />
                      <Label htmlFor="theme-light" className="text-xs cursor-pointer">
                        Light Theme (Recommended)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="theme-system" />
                      <Label htmlFor="theme-system" className="text-xs cursor-pointer">
                        System Preference
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Notifications & Scraper Cadence */}
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <CardTitle>Notifications & Crawler Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure webhook triggers and scraper poll intervals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">New Video Detection Alerts</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Send immediate in-app and webhook alerts when tracked creators post promotional videos.
                    </p>
                  </div>
                  <Switch
                    checked={formData.newVideoNotifications}
                    onCheckedChange={(val) =>
                      setFormData((prev) => ({ ...prev, newVideoNotifications: val }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Scraper Failure & Proxy Backoff Alerts</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Notify when a worker encounters TikTok rate limits or proxy connection drops.
                    </p>
                  </div>
                  <Switch
                    checked={formData.failedJobNotifications}
                    onCheckedChange={(val) =>
                      setFormData((prev) => ({ ...prev, failedJobNotifications: val }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Daily Email Intelligence Digest</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Receive summary of newly discovered videos and competitor product links every morning.
                    </p>
                  </div>
                  <Switch
                    checked={formData.emailAlerts}
                    onCheckedChange={(val) =>
                      setFormData((prev) => ({ ...prev, emailAlerts: val }))
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-1.5 max-w-sm">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="refreshInterval">Automated Crawler Check Interval</Label>
                    {isLoadingBackendPolicy && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Syncing with server...
                      </span>
                    )}
                  </div>
                  <Select
                    value={String(formData.autoRefreshInterval)}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, autoRefreshInterval: Number(val) }))
                    }
                  >
                    <SelectTrigger id="refreshInterval" className="h-9 text-xs">
                      <SelectValue placeholder="Select Interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Every 1 minute (Fast Testing / Debug)</SelectItem>
                      <SelectItem value="5">Every 5 minutes (Real-time Monitoring)</SelectItem>
                      <SelectItem value="15">Every 15 minutes (Standard Polling)</SelectItem>
                      <SelectItem value="30">Every 30 minutes (Medium Frequency)</SelectItem>
                      <SelectItem value="60">Every 60 minutes (Hourly)</SelectItem>
                      <SelectItem value="120">Every 120 minutes (2 Hours)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Directly controls backend crawler scheduler. Changes take effect immediately for active creators.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t py-3">
                {saveSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Settings & Crawler Scheduler updated successfully!
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Crawler frequency is saved directly to the database engine.
                  </span>
                )}
                <Button type="submit" size="sm" className="gap-1.5 text-xs" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" /> Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="proxy" className="m-0 focus-visible:outline-none">
          <DataSourcesPage embedded />
        </TabsContent>
      </Tabs>
    </div>
  )
}
