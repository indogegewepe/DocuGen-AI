export type PreviewResponse = {
  status: string
  message: string
  preview: string
  configs: Record<string, unknown>
  repo: string
  dataDiambil: {
    readmeName: string | null
    readmeBranch: string | null
  }
}

export type GenerateResponse = {
  status: string
  message: string
  markdown: string
  preview: string
  repo: string
  configs: Record<string, unknown>
  dataDiambil: {
    readmeName: string | null
    readmeBranch: string | null
  }
}

type StreamMetaPayload = Omit<GenerateResponse, "markdown">

type StreamEvent =
  | { type: "meta"; payload: StreamMetaPayload }
  | { type: "delta"; payload: { content: string } }
  | { type: "done"; payload: { markdown: string } }
  | { type: "error"; payload: { message: string } }

type GenerateReadmeStreamHandlers = {
  signal?: AbortSignal
  onMeta: (payload: StreamMetaPayload) => void
  onDelta: (chunk: string) => void
  onDone: (markdown: string) => void
}

async function requestJson<T>(
  path: string,
  repoUrl: string,
  signal?: AbortSignal
): Promise<T> {
  let response: Response

  try {
    response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repo_url: repoUrl }),
      signal,
    })
  } catch {
    throw new Error("Request ke server gagal. Coba lagi sebentar.")
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string
      detail?: string
    } | null
    const detail = payload?.error ?? payload?.detail ?? "Request gagal"
    throw new Error(detail)
  }

  return (await response.json()) as T
}

export function fetchPreview(
  repoUrl: string,
  signal?: AbortSignal
): Promise<PreviewResponse> {
  return requestJson<PreviewResponse>("/api/readme/preview", repoUrl, signal)
}

export function generateReadme(
  repoUrl: string,
  signal?: AbortSignal
): Promise<GenerateResponse> {
  return requestJson<GenerateResponse>("/api/readme/generate", repoUrl, signal)
}

export async function generateReadmeStream(
  repoUrl: string,
  handlers: GenerateReadmeStreamHandlers
): Promise<void> {
  let response: Response

  try {
    response = await fetch("/api/readme/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repo_url: repoUrl }),
      signal: handlers.signal,
    })
  } catch {
    throw new Error("Request ke server gagal. Coba lagi sebentar.")
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string
      detail?: string
    } | null
    throw new Error(payload?.error ?? payload?.detail ?? "Generate gagal")
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("Response stream tidak tersedia.")
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      while (true) {
        const lineEnd = buffer.indexOf("\n")
        if (lineEnd === -1) break

        const line = buffer.slice(0, lineEnd).trim()
        buffer = buffer.slice(lineEnd + 1)

        if (!line.startsWith("data: ")) {
          continue
        }

        const raw = line.slice(6)
        try {
          const event = JSON.parse(raw) as StreamEvent
          if (event.type === "meta") {
            handlers.onMeta(event.payload)
          } else if (event.type === "delta") {
            handlers.onDelta(event.payload.content)
          } else if (event.type === "done") {
            handlers.onDone(event.payload.markdown)
          } else if (event.type === "error") {
            throw new Error(event.payload.message)
          }
        } catch (error) {
          if (error instanceof Error) {
            throw error
          }
        }
      }
    }
  } finally {
    await reader.cancel()
  }
}
