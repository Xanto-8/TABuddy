const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

interface RequestOptions {
  headers?: Record<string, string>
  signal?: AbortSignal
  cache?: RequestCache
}

class HttpClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseURL}${path}`
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: options?.signal,
      cache: options?.cache || 'no-store',
    }

    if (body !== undefined) {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new HttpError(
          response.status,
          errorData?.message || `Request failed with status ${response.status}`,
          errorData
        )
      }

      const result = await response.json()
      return result.data !== undefined ? result.data : result
    } catch (error) {
      if (error instanceof HttpError) throw error
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request was aborted')
      }
      throw new HttpError(0, 'Network error - unable to connect to server')
    }
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options)
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options)
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options)
  }

  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options)
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options)
  }
}

export const httpClient = new HttpClient(API_BASE_URL)
