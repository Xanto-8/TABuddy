const API_BASE = '/api/data'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('tabuddy_auth_token')
    return stored || null
  } catch {
    return null
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const errorData = await response.json()
      message = errorData.error || message
    } catch {}
    throw new Error(message)
  }
  const result = await response.json()
  return result.data as T
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders() },
    cache: 'no-store',
  })
  return handleResponse<T>(response)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  return handleResponse<T>(response)
}

export function getAuthHeaders(): Record<string, string> {
  return authHeaders()
}

export { API_BASE }
