export type ApiResponse = {
  success?: boolean
  message?: string
  user?: {
    id: string
    email: string
    name?: string
    role: string
  } | null
  ad?: Record<string, unknown> | null
  urls?: string[]
  data?: Array<Record<string, unknown>> | Record<string, unknown> | null
  categories?: Array<Record<string, unknown>>
  cars?: Array<Record<string, unknown>>
  users?: Array<Record<string, unknown>>
  orderId?: string
  [key: string]: unknown
}

type FetchJsonResult<T> = {
  response: Response
  data: T
}

function buildFallbackMessage(raw: string) {
  if (!raw) return 'Empty response from server.'
  if (raw.startsWith('<!DOCTYPE') || raw.startsWith('<html')) {
    return 'Server returned HTML instead of JSON.'
  }
  return raw.slice(0, 500)
}

export async function fetchJson<T = ApiResponse>(input: RequestInfo | URL, init?: RequestInit): Promise<FetchJsonResult<T>> {
  const response = await fetch(input, init)
  const raw = await response.text()
  const trimmed = raw.trim()
  const contentType = response.headers.get('content-type') || ''

  if (!trimmed) {
    return { response, data: null as T }
  }

  if (contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return { response, data: JSON.parse(raw) as T }
    } catch {
      return {
        response,
        data: { message: 'Server returned malformed JSON.' } as T,
      }
    }
  }

  return {
    response,
    data: {
      message: buildFallbackMessage(trimmed),
      raw: trimmed.slice(0, 200),
    } as T,
  }
}
