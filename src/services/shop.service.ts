import { apiClient } from '@/lib/api-client'
import { Shop } from '@/types'

export const shopService = {
  async getShops(): Promise<Shop[]> {
    return apiClient.get<Shop[]>('/shops')
  },

  async getShopById(id: string): Promise<Shop> {
    return apiClient.get<Shop>(`/shops/${id}`)
  },
}

