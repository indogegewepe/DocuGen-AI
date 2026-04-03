const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-ID": getSessionId(),
    },
    body: JSON.stringify({ repo_url: repoUrl }),
  })

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
  const response = await fetch(
    `${API_BASE_URL}/api/readme/status/${jobId}`
  )
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: string }
      | null
    const detail = payload?.detail ?? "Polling gagal"
    throw new Error(detail)
  }

  return (await response.json()) as JobStatusResponse
}
