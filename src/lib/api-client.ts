/**
 * Centralized API Client for Influencer Monitor Frontend
 * Connects to NestJS Backend at /api/v1
 */

export interface ApiErrorResponse {
  statusCode: number
  message: string | string[]
  error?: string
  timestamp?: string
  path?: string
}

export class ApiError extends Error {
  statusCode: number
  errorDetails?: string | string[]
  path?: string

  constructor(
    statusCode: number,
    message: string,
    errorDetails?: string | string[],
    path?: string
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errorDetails = errorDetails
    this.path = path
  }
}

const DEFAULT_BASE_URL = 'http://localhost:3000/api/v1'
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
  DEFAULT_BASE_URL

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>
  timeoutMs?: number
}

function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = new URL(`${API_BASE_URL}${cleanEndpoint}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })
  }

  return url.toString()
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    let details: string | string[] | undefined
    let path: string | undefined

    if (contentType.includes('application/json')) {
      try {
        const errorJson = (await response.json()) as ApiErrorResponse
        if (errorJson.message) {
          errorMessage = Array.isArray(errorJson.message)
            ? errorJson.message.join(', ')
            : errorJson.message
          details = errorJson.message
        }
        path = errorJson.path
      } catch {
        // Fall back to status text
      }
    } else {
      try {
        const text = await response.text()
        if (text) errorMessage = text
      } catch {
        // Fall back to status text
      }
    }

    throw new ApiError(response.status, errorMessage, details, path)
  }

  if (response.status === 204) {
    return null as T
  }

  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  return (await response.text()) as unknown as T
}

export const apiClient = {
  baseUrl: API_BASE_URL,

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, timeoutMs = 30000, ...fetchOptions } = options
    const url = buildUrl(endpoint, params)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(fetchOptions.headers || {}),
        },
        signal: controller.signal,
        ...fetchOptions,
      })
      return await handleResponse<T>(response)
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError(408, `Request timed out after ${timeoutMs}ms`)
      }
      throw new ApiError(500, err instanceof Error ? err.message : 'Network request failed')
    } finally {
      clearTimeout(timer)
    }
  },

  async post<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, timeoutMs = 30000, ...fetchOptions } = options
    const url = buildUrl(endpoint, params)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(fetchOptions.headers || {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...fetchOptions,
      })
      return await handleResponse<T>(response)
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError(408, `Request timed out after ${timeoutMs}ms`)
      }
      throw new ApiError(500, err instanceof Error ? err.message : 'Network request failed')
    } finally {
      clearTimeout(timer)
    }
  },

  async put<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, timeoutMs = 30000, ...fetchOptions } = options
    const url = buildUrl(endpoint, params)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(fetchOptions.headers || {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...fetchOptions,
      })
      return await handleResponse<T>(response)
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError(408, `Request timed out after ${timeoutMs}ms`)
      }
      throw new ApiError(500, err instanceof Error ? err.message : 'Network request failed')
    } finally {
      clearTimeout(timer)
    }
  },

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, timeoutMs = 30000, ...fetchOptions } = options
    const url = buildUrl(endpoint, params)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(fetchOptions.headers || {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...fetchOptions,
      })
      return await handleResponse<T>(response)
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError(408, `Request timed out after ${timeoutMs}ms`)
      }
      throw new ApiError(500, err instanceof Error ? err.message : 'Network request failed')
    } finally {
      clearTimeout(timer)
    }
  },

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, timeoutMs = 30000, ...fetchOptions } = options
    const url = buildUrl(endpoint, params)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(fetchOptions.headers || {}),
        },
        signal: controller.signal,
        ...fetchOptions,
      })
      return await handleResponse<T>(response)
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError(408, `Request timed out after ${timeoutMs}ms`)
      }
      throw new ApiError(500, err instanceof Error ? err.message : 'Network request failed')
    } finally {
      clearTimeout(timer)
    }
  },

  /**
   * Multipart Form-Data upload without setting Content-Type (browser sets boundary automatically)
   */
  async upload<T>(
    endpoint: string,
    formData: FormData,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, timeoutMs = 60000, ...fetchOptions } = options
    const url = buildUrl(endpoint, params)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(fetchOptions.headers || {}),
        },
        body: formData,
        signal: controller.signal,
        ...fetchOptions,
      })
      return await handleResponse<T>(response)
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError(408, `Upload timed out after ${timeoutMs}ms`)
      }
      throw new ApiError(500, err instanceof Error ? err.message : 'Upload failed')
    } finally {
      clearTimeout(timer)
    }
  },

  /**
   * File download (e.g. CSV error reports)
   */
  async download(
    endpoint: string,
    defaultFilename: string,
    options: RequestOptions = {}
  ): Promise<void> {
    const { params, timeoutMs = 30000, ...fetchOptions } = options
    const url = buildUrl(endpoint, params)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        ...fetchOptions,
      })

      if (!response.ok) {
        throw new ApiError(
          response.status,
          `Download failed: ${response.statusText}`
        )
      }

      const blob = await response.blob()
      let filename = defaultFilename

      const disposition = response.headers.get('Content-Disposition')
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/)
        if (match && match[1]) {
          filename = match[1]
        }
      }

      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } finally {
      clearTimeout(timer)
    }
  },
}

