import { apiClient } from '@/lib/api-client'
import { TrackingJob } from '@/types'

export const trackingService = {
  async getJobs(): Promise<TrackingJob[]> {
    return apiClient.get<TrackingJob[]>('/tracking/jobs')
  },

  async retryJob(id: string): Promise<{ success: boolean; message: string; job: TrackingJob }> {
    return apiClient.post<{ success: boolean; message: string; job: TrackingJob }>(
      `/tracking/jobs/${id}/retry`
    )
  },
}

