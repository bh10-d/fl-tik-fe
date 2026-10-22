import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Video,
  Activity,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'

const navItems = [
  {
    title: 'Overview',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Influencers',
    url: '/influencers',
    icon: Users,
  },
  {
    title: 'Video Feed',
    url: '/videos',
    icon: Video,
  },
  {
    title: 'Tracking Activity',
    url: '/tracking',
    icon: Activity,
  },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { open } = useSidebar()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm tracking-tight shadow-sm shrink-0">
            IM
          </div>
          {open && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-semibold text-sm leading-tight text-foreground truncate">
                Influencer Monitor
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                TikTok Shop US Intelligence
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.url === '/'
                    ? location.pathname === '/' || location.pathname === '/overview'
                    : location.pathname.startsWith(item.url)

                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0" />
                        {open && <span className="truncate">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {open ? (
          <div className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="font-medium text-foreground">Pro Plan</span>
            </div>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
              US Market
            </Badge>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

