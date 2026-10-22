import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Bell,
  Search,
  Calendar as CalendarIcon,
  Check,
  User,
  Shield,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { formatTimeAgo } from '@/utils/formatters'

const routeTitles: Record<string, string> = {
  '/': 'Overview',
  '/overview': 'Overview',
  '/influencers': 'Influencers',
  '/videos': 'Video Feed',
  '/tracking': 'Tracking Activity',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/settings/data-sources': 'Data Sources & Proxy',
}

const dateRangeOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
]

export function AppHeader() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const {
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useApp()

  const currentTitle = routeTitles[location.pathname] || 'Dashboard'
  const unreadCount = notifications.filter((n) => !n.read).length

  const selectedRangeLabel =
    dateRangeOptions.find((d) => d.value === dateRange)?.label || 'Last 7 Days'

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="hidden sm:block">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search */}
        <div className="relative w-40 sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search creators, videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs bg-muted/40 border-muted"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 px-2.5 text-xs font-normal"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden md:inline">{selectedRangeLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1.5" align="end">
            <div className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
              Date Filter
            </div>
            {dateRangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs hover:bg-accent text-left transition-colors"
              >
                <span>{opt.label}</span>
                {dateRange === opt.value && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-destructive" />
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="font-semibold text-xs text-foreground">
                Notifications ({unreadCount} new)
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationAsRead(n.id)}
                  className={`p-3 text-xs cursor-pointer hover:bg-accent transition-colors ${
                    !n.read ? 'bg-muted/30 font-medium' : 'opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-foreground">{n.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                  {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold leading-none text-foreground truncate">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[11px] leading-none text-muted-foreground truncate">
                  {user?.email || 'admin@fl-tik.internal'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2 text-xs">
                <User className="h-3.5 w-3.5" />
                <span>Account Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings?tab=proxy" className="flex items-center gap-2 text-xs">
                <Shield className="h-3.5 w-3.5" />
                <span>Data Sources & Proxy</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="flex items-center gap-2 text-xs text-destructive cursor-pointer hover:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
