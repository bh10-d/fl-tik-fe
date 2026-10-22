import React from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'

export function AppLayout() {
  const { backendHealth, isCheckingHealth, checkHealth } = useApp()

  return (
    <SidebarProvider className="h-full w-full overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden bg-background">
        <AppHeader />

        {/* Backend Connection Error Alert (Only shown when backend is down) */}
        {backendHealth?.healthy === false && (
          <div className="flex items-center justify-between border-b bg-destructive/15 px-4 py-2 text-xs text-destructive shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
              <span className="font-medium">
                Backend Connection Error: Unable to communicate with API at http://localhost:3000/api/v1.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[11px] px-2 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => checkHealth()}
              disabled={isCheckingHealth}
            >
              <RotateCw className={`mr-1 h-3 w-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              Retry Connection
            </Button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}
