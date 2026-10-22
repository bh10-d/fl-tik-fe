import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { AppProvider } from '@/context/AppContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { InfluencersPage } from '@/pages/InfluencersPage'
import { VideoFeedPage } from '@/pages/VideoFeedPage'
import { TrackingActivityPage } from '@/pages/TrackingActivityPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SettingsPage } from '@/pages/SettingsPage'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected App Routes (Requires HttpOnly Cookie JWT) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/influencers" element={<InfluencersPage />} />
                <Route path="/videos" element={<VideoFeedPage />} />
                <Route path="/tracking" element={<TrackingActivityPage />} />
                <Route path="/shops" element={<Navigate to="/" replace />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/settings/data-sources"
                  element={<Navigate to="/settings?tab=proxy" replace />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
