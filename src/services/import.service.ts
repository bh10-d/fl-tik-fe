import { apiClient } from '@/lib/api-client'
import {
  ImportPreviewResponse,
  ImportExecuteResponse,
} from '@/types'

export const importService = {
  async previewFile(file: File): Promise<ImportPreviewResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.upload<ImportPreviewResponse>('/imports/influencers/preview', formData)
  },

  async executeImport(file: File): Promise<ImportExecuteResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.upload<ImportExecuteResponse>('/imports/influencers', formData)
  },

  async getImportBatch(importId: string): Promise<ImportExecuteResponse> {
    return apiClient.get<ImportExecuteResponse>(`/imports/${importId}`)
  },

  async downloadErrorsCsv(importId: string, filename = 'import_errors.csv'): Promise<void> {
    return apiClient.download(
      `/imports/${importId}/errors?format=csv`,
      filename
    )
  },
}

