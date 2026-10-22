import { apiClient } from '@/lib/api-client'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  createdAt?: string
}

export interface LoginResponse {
  success: boolean
  user: AuthUser
  message?: string
}

export interface MeResponse {
  success: boolean
  user: AuthUser
}

export const authService = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', credentials)
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/auth/logout')
  },

  async getMe(): Promise<MeResponse> {
    return apiClient.get<MeResponse>('/auth/me')
  },
}

