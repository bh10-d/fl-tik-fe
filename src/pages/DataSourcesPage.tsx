import React, { useState, useEffect, useCallback } from 'react'
import {
  Server,
  Globe,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Play,
  Square,
  Activity,
  Layers,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { dataSourcesService } from '@/services/data-sources.service'
import { DataSourcesResponse, TestConnectionResult } from '@/types'
import { formatTimeAgo } from '@/utils/formatters'

interface DataSourcesPageProps {
  embedded?: boolean
}

export function DataSourcesPage({ embedded = false }: DataSourcesPageProps = {}) {
  const [data, setData] = useState<DataSourcesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Internal Crawler State
  const [crawlerEnabled, setCrawlerEnabled] = useState(true)
  const [crawlerBaseUrl, setCrawlerBaseUrl] = useState('')
  const [crawlerAuthType, setCrawlerAuthType] = useState<'NONE' | 'BEARER' | 'API_KEY' | 'CUSTOM_HEADER'>('NONE')
  const [crawlerHeaderName, setCrawlerHeaderName] = useState('')
  const [crawlerApiKey, setCrawlerApiKey] = useState('')
  const [savingCrawler, setSavingCrawler] = useState(false)
  const [crawlerSaveSuccess, setCrawlerSaveSuccess] = useState(false)
  const [testingCrawler, setTestingCrawler] = useState(false)
  const [crawlerTestResult, setCrawlerTestResult] = useState<TestConnectionResult | null>(null)

  // Proxy State
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [proxyProtocol, setProxyProtocol] = useState<'HTTP' | 'HTTPS' | 'SOCKS5'>('HTTP')
  const [proxyHost, setProxyHost] = useState('')
  const [proxyPort, setProxyPort] = useState<number | ''>('')
  const [proxyUsername, setProxyUsername] = useState('')
  const [proxyPassword, setProxyPassword] = useState('')
  const [proxyRegion, setProxyRegion] = useState('US')
  const [proxyNotes, setProxyNotes] = useState('')
  const [savingProxy, setSavingProxy] = useState(false)
  const [proxySaveSuccess, setProxySaveSuccess] = useState(false)
  const [testingProxy, setTestingProxy] = useState(false)
  const [proxyTestResult, setProxyTestResult] = useState<TestConnectionResult | null>(null)

  // Collection Policy State
  const [activeProvider, setActiveProvider] = useState<string>('INTERNAL_CRAWLER')
  const [pollInterval, setPollInterval] = useState<number>(15)
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [policySaveSuccess, setPolicySaveSuccess] = useState(false)

  // Kill Switch Confirmation Modal
  const [killSwitchModalOpen, setKillSwitchModalOpen] = useState(false)
  const [killSwitchActionLoading, setKillSwitchActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await dataSourcesService.getAll()
      setData(res)

      // Sync form fields with fetched data
      const cr = res.providers.internalCrawler
      setCrawlerEnabled(cr.isEnabled)
      setCrawlerBaseUrl(cr.baseUrl || '')
      setCrawlerAuthType((cr.authType as any) || 'NONE')
      setCrawlerHeaderName(cr.headerName || '')

      const pr = res.proxy
      setProxyEnabled(pr.isEnabled)
      setProxyProtocol(pr.protocol)
      setProxyHost(pr.host || '')
      setProxyPort(pr.port || '')
      setProxyUsername(pr.username || '')
      setProxyRegion(pr.region || 'US')
      setProxyNotes(pr.notes || '')

      setActiveProvider(res.collectionPolicy.activeProvider)
      setPollInterval(res.collectionPolicy.pollIntervalMinutes)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load data sources configuration')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Save Crawler Config
  const handleSaveCrawler = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!crawlerBaseUrl.trim()) {
      alert('Internal Crawler Base URL is required')
      return
    }

    try {
      setSavingCrawler(true)
      const res = await dataSourcesService.updateCrawlerConfig({
        isEnabled: crawlerEnabled,
        baseUrl: crawlerBaseUrl.trim(),
        authType: crawlerAuthType,
        headerName: crawlerHeaderName.trim() || undefined,
        apiKey: crawlerApiKey.trim() || undefined,
      })
      setData(res)
      setCrawlerApiKey('')
      setCrawlerSaveSuccess(true)
      setTimeout(() => setCrawlerSaveSuccess(false), 3000)
    } catch (err: any) {
      alert(`Failed to save crawler config: ${err.message}`)
    } finally {
      setSavingCrawler(false)
    }
  }

  // Test Crawler Connection
  const handleTestCrawler = async () => {
    try {
      setTestingCrawler(true)
      setCrawlerTestResult(null)
      const res = await dataSourcesService.testConnection('INTERNAL_CRAWLER')
      setCrawlerTestResult(res)
    } catch (err: any) {
      setCrawlerTestResult({
        provider: 'INTERNAL_CRAWLER',
        success: false,
        statusCode: 502,
        latencyMs: 0,
        message: err.message || 'Test connection failed',
      })
    } finally {
      setTestingCrawler(false)
    }
  }

  // Save Proxy Config
  const handleSaveProxy = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingProxy(true)
      const res = await dataSourcesService.updateProxyConfig({
        isEnabled: proxyEnabled,
        protocol: proxyProtocol,
        host: proxyHost.trim() || undefined,
        port: proxyPort ? Number(proxyPort) : undefined,
        username: proxyUsername.trim() || undefined,
        password: proxyPassword.trim() || undefined,
        region: proxyRegion.trim() || 'US',
        notes: proxyNotes.trim() || undefined,
      })
      setData(res)
      setProxyPassword('')
      setProxySaveSuccess(true)
      setTimeout(() => setProxySaveSuccess(false), 3000)
    } catch (err: any) {
      alert(`Failed to save proxy config: ${err.message}`)
    } finally {
      setSavingProxy(false)
    }
  }

  // Test Proxy Socket
  const handleTestProxy = async () => {
    try {
      setTestingProxy(true)
      setProxyTestResult(null)
      const res = await dataSourcesService.testConnection('PROXY')
      setProxyTestResult(res)
    } catch (err: any) {
      setProxyTestResult({
        provider: 'PROXY',
        success: false,
        statusCode: 502,
        latencyMs: 0,
        message: err.message || 'Proxy socket test failed',
      })
    } finally {
      setTestingProxy(false)
    }
  }

  // Save Collection Policy
  const handleSavePolicy = async () => {
    try {
      setSavingPolicy(true)
      const res = await dataSourcesService.updateCollectionPolicy({
        activeProvider: activeProvider as any,
        pollIntervalMinutes: Number(pollInterval),
      })
      setData(res)
      setPolicySaveSuccess(true)
      setTimeout(() => setPolicySaveSuccess(false), 3000)
    } catch (err: any) {
      alert(`Failed to update collection policy: ${err.message}`)
    } finally {
      setSavingPolicy(false)
    }
  }

  // Toggle Global Kill Switch
  const handleToggleKillSwitch = async () => {
    if (!data) return
    try {
      setKillSwitchActionLoading(true)
      let res: DataSourcesResponse
      if (data.collectionPolicy.isCollectionActive) {
        res = await dataSourcesService.stopCollection('Manual stop via Dashboard toggle')
      } else {
        res = await dataSourcesService.startCollection()
      }
      setData(res)
      setKillSwitchModalOpen(false)
    } catch (err: any) {
      alert(`Kill switch toggle failed: ${err.message}`)
    } finally {
      setKillSwitchActionLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          Loading unified data source & proxy configuration...
        </div>
      </div>
    )
  }

  const isCollectionHalted = data ? !data.collectionPolicy.isCollectionActive : false

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Operational Status Banner & Kill Switch */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${embedded ? 'pt-1' : ''}`}>
        {!embedded ? (
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Data Sources & Proxy Settings
              </h1>
              <Badge variant="outline" className="text-xs">Unified Module</Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Centralized management for internal crawler endpoints, US residential proxies, optional providers, and collection safety.
            </p>
          </div>
        ) : (
          <div>
            <div className="text-sm font-semibold text-foreground">
              Internal Crawler & Proxy Infrastructure
            </div>
            <p className="text-xs text-muted-foreground">
              Configure scraping endpoints, residential IP proxies, and global collection safety.
            </p>
          </div>
        )}

        {/* Global Collection Status & Control */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`inline-flex items-center gap-2 px-3 h-8 rounded-md text-xs font-medium border transition-colors ${
              isCollectionHalted
                ? 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/50 dark:text-rose-400'
                : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:border-emerald-900/50 dark:text-emerald-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isCollectionHalted ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="whitespace-nowrap font-medium">
              {isCollectionHalted ? 'Collection Halted' : 'Collection Active'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setKillSwitchModalOpen(true)}
            className={`h-8 px-3 text-xs gap-1.5 font-medium transition-colors ${
              isCollectionHalted
                ? 'border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                : 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50'
            }`}
          >
            {isCollectionHalted ? (
              <>
                <Play className="h-3.5 w-3.5 fill-emerald-600 dark:fill-emerald-400" />
                <span className="whitespace-nowrap">Resume Collection</span>
              </>
            ) : (
              <>
                <Square className="h-3 w-3 fill-destructive" />
                <span className="whitespace-nowrap">Stop Collection</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* SECTION A: Provider Selection Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Available Data Providers
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Configure endpoints and authentication. Saving does not trigger automatic scraping.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Internal TikTok Crawler Card */}
          <Card className="border-border shadow-none flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-semibold">
                      Internal TikTok Crawler API
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Primary scraper API service hosted separately. Uses residential proxies directly.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={crawlerEnabled}
                    onCheckedChange={setCrawlerEnabled}
                    aria-label="Toggle Internal Crawler"
                  />
                  <Badge
                    variant={
                      data?.providers.internalCrawler.status === 'HEALTHY'
                        ? 'default'
                        : data?.providers.internalCrawler.status === 'DEGRADED'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="text-[10px] uppercase font-semibold"
                  >
                    {data?.providers.internalCrawler.status || 'UNCONFIGURED'}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleSaveCrawler} className="flex-1 flex flex-col justify-between">
              <CardContent className="space-y-3.5 text-xs pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="crawlerBaseUrl" className="text-xs font-medium">
                    API Base URL <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="crawlerBaseUrl"
                    value={crawlerBaseUrl}
                    onChange={(e) => setCrawlerBaseUrl(e.target.value)}
                    placeholder="http://crawler-service.internal:4000"
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="crawlerAuthType" className="text-xs font-medium">
                      Authentication
                    </Label>
                    <Select
                      value={crawlerAuthType}
                      onValueChange={(val: any) => setCrawlerAuthType(val)}
                    >
                      <SelectTrigger id="crawlerAuthType" className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None (Internal VPC)</SelectItem>
                        <SelectItem value="BEARER">Bearer Token</SelectItem>
                        <SelectItem value="API_KEY">Header: API Key</SelectItem>
                        <SelectItem value="CUSTOM_HEADER">Custom Header</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {crawlerAuthType !== 'NONE' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="crawlerHeaderName" className="text-xs font-medium">
                        Header Name
                      </Label>
                      <Input
                        id="crawlerHeaderName"
                        value={crawlerHeaderName}
                        onChange={(e) => setCrawlerHeaderName(e.target.value)}
                        placeholder={crawlerAuthType === 'BEARER' ? 'Authorization' : 'x-api-key'}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </div>

                {crawlerAuthType !== 'NONE' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="crawlerApiKey" className="text-xs font-medium">
                      API Token / Secret Key
                    </Label>
                    <Input
                      id="crawlerApiKey"
                      type="password"
                      value={crawlerApiKey}
                      onChange={(e) => setCrawlerApiKey(e.target.value)}
                      placeholder={
                        data?.providers.internalCrawler.maskedApiKey
                          ? `Configured (${data.providers.internalCrawler.maskedApiKey})`
                          : 'Enter secret token'
                      }
                      className="h-8 text-xs font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Leave blank to preserve currently configured secret.
                    </p>
                  </div>
                )}

                <div className="rounded-md bg-muted/40 p-2.5 space-y-1 text-[11px] border border-border/50">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Last Successful Sync:</span>
                    <span className="font-medium text-foreground">
                      {data?.providers.internalCrawler.lastSuccessfulRequestAt
                        ? formatTimeAgo(data.providers.internalCrawler.lastSuccessfulRequestAt)
                        : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Last Tested:</span>
                    <span className="font-medium text-foreground">
                      {data?.providers.internalCrawler.lastTestedAt
                        ? formatTimeAgo(data.providers.internalCrawler.lastTestedAt)
                        : 'Never'}
                    </span>
                  </div>
                  {data?.providers.internalCrawler.lastError && (
                    <div className="text-rose-600 dark:text-rose-400 font-mono text-[10px] pt-1 truncate">
                      Err: {data.providers.internalCrawler.lastError}
                    </div>
                  )}
                </div>

                {/* Connection Test Result */}
                {crawlerTestResult && (
                  <div
                    className={`rounded-md p-2.5 text-xs flex items-start gap-2 border ${
                      crawlerTestResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {crawlerTestResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{crawlerTestResult.message}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        Status: {crawlerTestResult.statusCode} • Latency: {crawlerTestResult.latencyMs}ms
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t py-3 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestCrawler}
                  disabled={testingCrawler || !crawlerBaseUrl}
                  className="text-xs h-8 gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testingCrawler ? 'animate-spin' : ''}`} />
                  Test Connection
                </Button>

                <div className="flex items-center gap-2">
                  {crawlerSaveSuccess && (
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Saved!
                    </span>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingCrawler}
                    className="text-xs h-8 gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Configuration
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* SECTION B: Shared Proxy Configuration Card */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Residential Proxy Configuration
                </CardTitle>
                <Badge variant="outline" className="text-[10px] py-0">US Residential</Badge>
              </div>
              <CardDescription className="text-xs">
                Forwarded to the internal TikTok crawler API for outbound requests. Never applied to PostgreSQL, Redis, or browser requests.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={proxyEnabled}
                onCheckedChange={setProxyEnabled}
                aria-label="Toggle Residential Proxy"
              />
              <span className="text-xs font-medium">
                {proxyEnabled ? 'Proxy Enabled' : 'Proxy Disabled'}
              </span>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSaveProxy}>
          <CardContent className="space-y-4 text-xs pt-1">
            {/* Architecture / Disclaimer Notice */}
            <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-[11px] text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground">
                Network Routing & Service Ownership Policy:
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  <strong>Internal Crawler Service</strong> owns outbound TikTok connections and handles proxy rotation.
                </li>
                <li>
                  Proxy credentials are only transmitted directly to the internal crawler via secure internal headers.
                </li>
                <li>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Disclaimer:</span> Testing proxy connectivity validates TCP socket reachability to the host/port. It does not guarantee TikTok platform bypass or CAPTCHA clearance.
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="proxyProtocol" className="text-xs font-medium">Protocol</Label>
                <Select
                  value={proxyProtocol}
                  onValueChange={(val: any) => setProxyProtocol(val)}
                  disabled={!proxyEnabled}
                >
                  <SelectTrigger id="proxyProtocol" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HTTP">HTTP</SelectItem>
                    <SelectItem value="HTTPS">HTTPS</SelectItem>
                    <SelectItem value="SOCKS5">SOCKS5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="proxyHost" className="text-xs font-medium">Host Address / IP</Label>
                <Input
                  id="proxyHost"
                  value={proxyHost}
                  onChange={(e) => setProxyHost(e.target.value)}
                  placeholder="p.webshare.io or proxy.residential.net"
                  className="h-8 text-xs font-mono"
                  disabled={!proxyEnabled}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="proxyPort" className="text-xs font-medium">Port</Label>
                <Input
                  id="proxyPort"
                  type="number"
                  value={proxyPort}
                  onChange={(e) => setProxyPort(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="22225"
                  className="h-8 text-xs font-mono"
                  disabled={!proxyEnabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="proxyUsername" className="text-xs font-medium">Username (Optional)</Label>
                <Input
                  id="proxyUsername"
                  value={proxyUsername}
                  onChange={(e) => setProxyUsername(e.target.value)}
                  placeholder="lum-customer-hl-zone-res"
                  className="h-8 text-xs"
                  disabled={!proxyEnabled}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proxyPassword" className="text-xs font-medium">Password</Label>
                <Input
                  id="proxyPassword"
                  type="password"
                  value={proxyPassword}
                  onChange={(e) => setProxyPassword(e.target.value)}
                  placeholder={
                    data?.proxy.maskedPassword
                      ? `Configured (${data.proxy.maskedPassword})`
                      : 'Proxy password'
                  }
                  className="h-8 text-xs font-mono"
                  disabled={!proxyEnabled}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proxyRegion" className="text-xs font-medium">Geographic Region</Label>
                <Input
                  id="proxyRegion"
                  value={proxyRegion}
                  onChange={(e) => setProxyRegion(e.target.value)}
                  placeholder="US (United States)"
                  className="h-8 text-xs"
                  disabled={!proxyEnabled}
                />
              </div>
            </div>

            {/* Test Result for Proxy */}
            {proxyTestResult && (
              <div
                className={`rounded-md p-2.5 text-xs flex items-start gap-2 border ${
                  proxyTestResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {proxyTestResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{proxyTestResult.message}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    Latency: {proxyTestResult.latencyMs}ms • Socket Route Check
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t py-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestProxy}
              disabled={testingProxy || !proxyHost || !proxyPort}
              className="text-xs h-8 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testingProxy ? 'animate-spin' : ''}`} />
              Test Proxy Socket
            </Button>

            <div className="flex items-center gap-2">
              {proxySaveSuccess && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Saved!
                </span>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={savingProxy}
                className="text-xs h-8 gap-1.5"
              >
                <Save className="h-3.5 w-3.5" /> Save Proxy Settings
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* SECTION C & D: Active Provider & Usage/Safety Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section C: Active Collection Provider */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                Active Collection Provider
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Determine which provider is authorized for automatic background polling.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="activeProviderSelect" className="text-xs font-medium">
                Primary Polling Provider
              </Label>
              <Select
                value={activeProvider}
                onValueChange={(val: any) => setActiveProvider(val)}
              >
                <SelectTrigger id="activeProviderSelect" className="h-8 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL_CRAWLER">
                    Internal TikTok Crawler API (Recommended)
                  </SelectItem>
                  <SelectItem value="MOCK">Mock Provider (Local Simulation)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pollIntervalSelect" className="text-xs font-medium">
                Target Polling Frequency
              </Label>
              <Select
                value={String(pollInterval)}
                onValueChange={(val) => setPollInterval(Number(val))}
              >
                <SelectTrigger id="pollIntervalSelect" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Every 15 minutes (Target Interval)</SelectItem>
                  <SelectItem value="30">Every 30 minutes (Standard)</SelectItem>
                  <SelectItem value="60">Every 60 minutes (Low Frequency)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Background worker polls due creators and applies backoff when rate limited.
              </p>
            </div>

            <Separator />

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Internal Crawler Status:</span>
                <span className="font-medium text-foreground">
                  {data?.providers.internalCrawler.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proxy Forwarding:</span>
                <span className="font-medium text-foreground">
                  {data?.proxy.isEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Collection Attempt:</span>
                <span className="font-medium text-foreground">
                  {data?.collectionPolicy.lastCollectionAttemptAt
                    ? formatTimeAgo(data.collectionPolicy.lastCollectionAttemptAt)
                    : 'None yet'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recent Failures:</span>
                <span
                  className={`font-medium ${
                    (data?.collectionPolicy.recentFailureCount || 0) > 0
                      ? 'text-rose-600 font-semibold'
                      : 'text-foreground'
                  }`}
                >
                  {data?.collectionPolicy.recentFailureCount ?? 0}
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t py-3 flex justify-between items-center">
            {policySaveSuccess ? (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Policy Saved!
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Applies to upcoming polling cycles.
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSavePolicy}
              disabled={savingPolicy}
              className="text-xs h-8 gap-1.5"
            >
              <Save className="h-3.5 w-3.5" /> Save Policy
            </Button>
          </CardFooter>
        </Card>

        {/* Section D: Operational Metrics & Safety */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                Usage & Operational Safety
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Measured requests, outcomes, and kill switch controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3 bg-muted/20">
                <div className="text-[11px] text-muted-foreground font-medium">Crawler Requests</div>
                <div className="text-lg font-bold mt-1 text-foreground">
                  {data?.providers.internalCrawler.metrics.totalRequests ?? 0}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {data?.providers.internalCrawler.metrics.successfulRequests ?? 0} success •{' '}
                  {data?.providers.internalCrawler.metrics.failedRequests ?? 0} failed
                </div>
              </div>

              <div className="rounded-md border p-3 bg-muted/20">
                <div className="text-[11px] text-muted-foreground font-medium">Residential Proxy</div>
                <div className="text-sm font-semibold mt-1 text-foreground flex items-center gap-1.5">
                  <Badge variant={data?.proxy.isEnabled ? 'default' : 'secondary'} className="text-[10px]">
                    {data?.proxy.isEnabled ? 'ENABLED' : 'DISABLED'}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    {data?.proxy.protocol || 'HTTP'}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 truncate">
                  {data?.proxy.host ? `${data.proxy.host}:${data.proxy.port || '80'}` : 'No host configured'}
                </div>
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-2 bg-muted/10">
              <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                <span>Scheduler Health</span>
                <Badge
                  variant={isCollectionHalted ? 'destructive' : 'default'}
                  className="text-[10px]"
                >
                  {isCollectionHalted ? 'STOPPED' : 'HEALTHY'}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground space-y-1">
                <div>Poll interval: {data?.collectionPolicy.pollIntervalMinutes ?? 15} minutes</div>
                <div>Max concurrency: {data?.collectionPolicy.maxConcurrentJobs ?? 3} jobs</div>
                {data?.collectionPolicy.lastError && (
                  <div className="text-rose-600 dark:text-rose-400 font-mono text-[10px] pt-1">
                    Last issue: {data.collectionPolicy.lastError}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal: Global Kill Switch Toggle */}
      <Dialog open={killSwitchModalOpen} onOpenChange={setKillSwitchModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>
                {data?.collectionPolicy.isCollectionActive
                  ? 'Engage Global Collection Kill Switch?'
                  : 'Resume Background Collection?'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              {data?.collectionPolicy.isCollectionActive
                ? 'Engaging the kill switch will immediately halt all scheduled crawler runs and block queued background sync jobs from making outbound requests. Existing video history and influencer records will remain intact.'
                : 'Resuming collection will allow the scheduler and BullMQ workers to resume periodic checks according to the configured 15-minute polling policy.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKillSwitchModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={data?.collectionPolicy.isCollectionActive ? 'destructive' : 'default'}
              size="sm"
              onClick={handleToggleKillSwitch}
              disabled={killSwitchActionLoading}
            >
              {data?.collectionPolicy.isCollectionActive
                ? 'Confirm Kill Switch'
                : 'Confirm Resume'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default DataSourcesPage
