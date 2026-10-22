import { apiClient } from '@/lib/api-client'
import { Product } from '@/types'

export interface LinkProductPayload {
  productId: string
  evidenceType: 'TAG' | 'CAPTION_LINK' | 'AFFILIATE_LINK' | 'MANUAL' | string
  evidenceSource: string
  confidence?: number
}

export const productService = {
  async getProducts(shopId?: string): Promise<Product[]> {
    return apiClient.get<Product[]>('/products', {
      params: shopId ? { shopId } : undefined,
    })
  },

  async getProductById(id: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`)
  },

  async linkProductToVideo(
    videoId: string,
    payload: LinkProductPayload
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(
      `/videos/${videoId}/link-product`,
      payload
    )
  },
}

