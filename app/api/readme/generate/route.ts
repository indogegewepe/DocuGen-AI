import { NextResponse } from "next/server"

import { fetchRepoData } from "@/lib/server/fetch-repo-data"
import { buildReadmePayload, openReadmeStreamRequest } from "@/lib/server/generate-readme"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { repo_url?: unknown }
    const repoUrl = typeof body.repo_url === "string" ? body.repo_url.trim() : ""

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Field repo_url wajib diisi." },
        { status: 400 }
      )
    }

    const repoData = await fetchRepoData(repoUrl)
    const repoName = `${repoData.owner}/${repoData.repo}`
    const payload = buildReadmePayload(
      repoName,
      repoData.readmeContent,
      repoData.configs,
      true
    )

    const upstream = await openReadmeStreamRequest(payload, true, request.signal)
    const upstreamBody = upstream.body

    if (!upstream.ok) {
      const bodyText = await upstream.text()
      throw new Error(`OpenRouter HTTP error ${upstream.status}: ${bodyText}`)
    }

    if (!upstreamBody) {
      throw new Error("Stream dari OpenRouter tidak tersedia.")
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (value: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`))
        }

        const reader = upstreamBody.getReader()
        let buffer = ""
        let markdown = ""

        emit({
          type: "meta",
          payload: {
            status: "ok",
            message: "README markdown sedang di-generate",
            preview: repoData.readmeContent || "README tidak ditemukan",
            repo: repoName,
            configs: repoData.configs,
            dataDiambil: {
              readmeName: repoData.readmeName,
              readmeBranch: repoData.readmeBranch,
            },
          },
        })

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

              const data = line.slice(6)
              if (data === "[DONE]") {
                emit({ type: "done", payload: { markdown } })
                controller.close()
                return
              }

              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string } }>
                }
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  markdown += content
                  emit({ type: "delta", payload: { content } })
                }
              } catch {
                // Abaikan chunk non-JSON atau non-delta.
              }
            }
          }

          emit({ type: "done", payload: { markdown } })
          controller.close()
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stream generate terhenti"
          emit({ type: "error", payload: { message } })
          controller.close()
        } finally {
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generate README gagal"
    const status = /valid|github\.com|repo_url/i.test(message) ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
