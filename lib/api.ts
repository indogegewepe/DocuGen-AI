const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()

const API_BASE_URL = rawApiBaseUrl
  ? rawApiBaseUrl.replace(/\/+$/, "")
  : process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000"
    : ""

function buildApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL belum di-set untuk environment ini"
    )
  }

  return `${API_BASE_URL}${path}`
}

function getSessionId(): string {
  if (typeof window === "undefined") return ""
  const stored = localStorage.getItem("session-id")
  if (stored) return stored
  const newId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  localStorage.setItem("session-id", newId)
  return newId
}

export type PreviewResponse = {
  status: string
  message: string
  preview: string
  configs: Record<string, unknown>
  repo: string
}

export type JobEnqueueResponse = {
  job_id: string
  repo_url: string
  repo: string
  queue_position: number
  total_pending: number
  status: string
}

export type JobStatusResponse = {
  job_id: string
  status: string
  queue_position: number
  total_pending: number
  markdown?: string
  error?: string
  created_at: string
  elapsed_seconds: number
}

export type GenerateResponse = {
  status: string
  message: string
  markdown: string
  preview: string
  repo: string
  configs: Record<string, unknown>
}

async function requestJson<T>(path: string, repoUrl: string): Promise<T> {
  let response: Response

  try {
    response = await fetch(buildApiUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-ID": getSessionId(),
      },
      body: JSON.stringify({ repo_url: repoUrl }),
    })
  } catch {
    throw new Error(
      "Request ke backend gagal. Cek URL backend, HTTPS, dan konfigurasi CORS"
    )
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: string }
      | null
    const detail = payload?.detail ?? "Request gagal"
    throw new Error(detail)
  }

  return (await response.json()) as T
}

export function fetchPreview(repoUrl: string): Promise<PreviewResponse> {
  return requestJson<PreviewResponse>("/api/readme/preview", repoUrl)
}

export async function enqueueGenerateReadme(
  repoUrl: string
): Promise<JobEnqueueResponse> {
  return requestJson<JobEnqueueResponse>("/api/readme/generate", repoUrl)
}

export async function pollJobStatus(jobId: string): Promise<JobStatusResponse> {
  let response: Response

  try {
    response = await fetch(buildApiUrl(`/api/readme/status/${jobId}`))
  } catch {
    throw new Error(
      "Polling ke backend gagal. Cek URL backend, HTTPS, dan konfigurasi CORS"
    )
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: string }
      | null
    const detail = payload?.detail ?? "Polling gagal"
    throw new Error(detail)
  }

  return (await response.json()) as JobStatusResponse
}
