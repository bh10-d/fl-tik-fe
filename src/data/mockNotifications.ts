import { SystemNotification } from '@/types'

export const mockNotifications: SystemNotification[] = [
  {
    id: 'notif-01',
    title: 'New Video Detected',
    message: '@alexa_glam_us posted a new video promoting GlowRecipe Watermelon Dew Drops.',
    type: 'success',
    createdAt: '2026-10-18T03:05:22Z',
    read: false,
  },
  {
    id: 'notif-02',
    title: 'New Video Detected',
    message: '@tech_marcus posted a new video featuring Anker MagGo Qi2 Power Bank.',
    type: 'success',
    createdAt: '2026-10-18T04:45:10Z',
    read: false,
  },
  {
    id: 'notif-03',
    title: 'Tracking Job Alert',
    message: 'Job for @mia_outfits_nyc paused due to scraper proxy rate-limiting.',
    type: 'warning',
    createdAt: '2026-10-18T03:00:15Z',
    read: true,
  },
  {
    id: 'notif-04',
    title: 'Weekly Digest Ready',
    message: 'Engagement reports for 12 monitored US creators are now compiled.',
    type: 'info',
    createdAt: '2026-10-17T12:00:00Z',
    read: true,
  },
]

