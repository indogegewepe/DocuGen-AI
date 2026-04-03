"use client"

import { useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"
import "github-markdown-css/github-markdown.css"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  fetchPreview,
  type GenerateResponse,
  type PreviewResponse,
} from "@/lib/api"
import { enqueueGenerateReadme, pollJobStatus } from "@/lib/api"
import { useEffect } from "react"

const githubUrlPattern = /^https:\/\/(www\.)?github\.com\/.+\/.+/i

// Schema sanitasi yang lebih luas untuk konten GitHub-like
const githubLikeSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // Izinkan align, style, width di berbagai tag
    "*": [...(defaultSchema.attributes?.["*"] || []), "align", "style"],
    img: [...(defaultSchema.attributes?.img || []), "width", "height", "style"],
    div: [...(defaultSchema.attributes?.div || []), "align", "style"],
    p: [...(defaultSchema.attributes?.p || []), "align", "style"],
    span: [...(defaultSchema.attributes?.span || []), "style", "align"],
  },
}

function toPrettyConfig(configs: Record<string, unknown>) {
  return Object.entries(configs).map(([name, value]) => {
    const content =
      typeof value === "string" ? value : JSON.stringify(value, null, 2)
    return { name, content }
  })
}

export default function Page() {
  const [repoUrl, setRepoUrl] = useState("")
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
  const [generatedData, setGeneratedData] = useState<GenerateResponse | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<"pending" | "processing" | "completed" | "failed" | null>(null)
  const [queuePosition, setQueuePosition] = useState(0)
  const [totalPending, setTotalPending] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Poll job status setiap 1 detik saat ada job aktif
  useEffect(() => {
    if (!jobId || !jobStatus) return

    const pollInterval = setInterval(async () => {
      try {
        const status = await pollJobStatus(jobId)
        setJobStatus(status.status as any)
        setQueuePosition(status.queue_position)
        setTotalPending(status.total_pending)
        setElapsedSeconds(status.elapsed_seconds)

        if (status.status === "completed" && status.markdown) {
          setGeneratedData({
            repo: repoUrl.split("/").slice(-2).join("/"),
            status: "ok",
            message: "README markdown berhasil di-generate",
            markdown: status.markdown,
            preview: previewData?.preview ?? "",
            configs: previewData?.configs ?? {},
          })
          setJobId(null)
          setJobStatus(null)
          setElapsedSeconds(0)
          toast.success("README markdown berhasil di-generate")
        } else if (status.status === "failed") {
          setError(status.error || "Gagal generate README")
          setJobId(null)
          setJobStatus(null)
          setElapsedSeconds(0)
          toast.error(status.error || "Gagal generate README")
        }
      } catch (err) {
        console.error("Polling error:", err)
      }
    }, 1000)

    return () => clearInterval(pollInterval)
  }, [jobId, jobStatus, previewData, repoUrl])

  const configList = useMemo(
    () => toPrettyConfig(generatedData?.configs ?? previewData?.configs ?? {}),
    [generatedData?.configs, previewData?.configs]
  )

  const canSubmit = githubUrlPattern.test(repoUrl.trim())

  async function handlePreview() {
    if (!canSubmit) {
      setError("URL harus format GitHub publik yang valid")
      return
    }

    try {
      setError(null)
      setLoadingPreview(true)
      setGeneratedData(null)
      const data = await fetchPreview(repoUrl.trim())
      setPreviewData(data)
      toast.success("Preview README berhasil diambil")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Preview gagal"
      setError(message)
      toast.error(message)
    } finally {
      setLoadingPreview(false)
    }
  }

  const hasActiveJob = !!jobId && !!jobStatus && ["pending", "processing"].includes(jobStatus)
  const generateButtonLabel = hasActiveJob
    ? jobStatus === "processing"
      ? "Generating..."
      : "Queued..."
    : loadingGenerate
      ? "Starting..."
      : "Generate README"

  async function handleGenerate() {
    if (!canSubmit) {
      setError("URL harus format GitHub publik yang valid")
      return
    }

    try {
      setError(null)
      setJobId(null)
      setLoadingGenerate(true)
      if (!previewData) {
        const pre = await fetchPreview(repoUrl.trim())
        setPreviewData(pre)
      }
      // Enqueue job dan mulai polling
      const enqueueResult = await enqueueGenerateReadme(repoUrl.trim())
      setJobId(enqueueResult.job_id)
      setJobStatus("pending")
      setQueuePosition(enqueueResult.queue_position)
      setTotalPending(enqueueResult.total_pending)
      setElapsedSeconds(0)
      toast.info(
        `Job masuk antrian. Posisi: ${enqueueResult.queue_position} dari ${enqueueResult.total_pending}`
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generate gagal"
      setError(message)
      toast.error(message)
      setJobId(null)
      setJobStatus(null)
    } finally {
      setLoadingGenerate(false)
    }
  }

  async function handleCopyMarkdown() {
    if (!generatedData?.markdown) return
    await navigator.clipboard.writeText(generatedData.markdown)
    toast.success("Markdown disalin")
  }

  return (
    <main className="min-h-svh bg-gradient-to-b from-background via-background to-muted/40 p-4 md:p-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="rounded-2xl border bg-card/70 p-4 backdrop-blur md:p-6">
          <h1 className="font-heading text-2xl font-semibold md:text-3xl">
            DocuGen AI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aplikasi ini memungkinkan pengguna untuk memasukkan URL repository GitHub, mengambil README yang tersedia, serta mendeteksi file konfigurasi proyek. Selanjutnya, sistem akan menggunakan AI untuk menghasilkan README baru yang lebih terstruktur, rapi, dan profesional dalam format Markdown.
          </p>

          <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_auto]">
            <Input
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder="https://github.com/owner/repo"
              disabled={loadingGenerate || hasActiveJob}
            />
            <Button
              onClick={handlePreview}
              disabled={loadingPreview || loadingGenerate || hasActiveJob}
              variant="outline"
            >
              {loadingPreview ? "Loading..." : "Preview"}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!canSubmit || loadingGenerate || loadingPreview || hasActiveJob}
            >
              {generateButtonLabel}
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Terjadi masalah</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {hasActiveJob && jobId ? (
          <Alert>
            <AlertTitle>
              {jobStatus === "processing" ? "⚙️ Generating..." : "⏳ Queued"}
            </AlertTitle>
            <AlertDescription>
              {jobStatus === "processing" ? (
                <>Sedang diproses oleh AI... (<strong>{elapsedSeconds}s</strong>)</>
              ) : (
                <>
                  Posisi: <strong>#{queuePosition}</strong> dari{" "}
                  <strong>{totalPending}</strong> job
                </>
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border bg-card p-4 md:p-6">
            <h2 className="font-heading text-lg font-semibold">Preview README</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Menampilkan konten README asli yang ditemukan dari repository GitHub sebagai referensi awal sebelum diproses oleh AI.
            </p>
            <div className="mt-4 max-h-[520px] overflow-auto rounded-lg border p-3">
              {previewData?.preview ? (
                <div className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[
                      [rehypeSanitize, githubLikeSanitizeSchema],
                      rehypeHighlight,
                    ]}
                  >
                    {previewData.preview}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Belum ada preview.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border bg-card p-4 md:p-6">
            <h2 className="font-heading text-lg font-semibold">Konfigurasi Repository</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Menampilkan file konfigurasi proyek yang berhasil diidentifikasi dari repository GitHub.
            </p>

            {configList.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {configList.map((config) => (
                  <article key={config.name} className="rounded-lg border p-3">
                    <h3 className="text-sm font-medium">{config.name}</h3>
                    <pre className="mt-2 max-h-52 overflow-auto text-xs whitespace-pre-wrap text-muted-foreground">
                      {config.content}
                    </pre>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                Belum ada file konfigurasi yang ditampilkan.
              </p>
            )}
          </article>
        </section>

        <section className="rounded-2xl border bg-card p-4 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-xl font-semibold md:text-2xl">
              README Hasil AI (Markdown)
            </h2>
            <Button
              onClick={handleCopyMarkdown}
              disabled={!generatedData?.markdown}
              variant="secondary"
              size="sm"
            >
              Copy Markdown
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Hasil final dari endpoint generate backend.
          </p>

          {generatedData?.markdown ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="min-h-[520px] overflow-auto rounded-lg border bg-muted/40 p-4">
                <h3 className="mb-2 text-sm font-medium">Raw Markdown</h3>
                <pre className="text-xs whitespace-pre-wrap">
                  {generatedData.markdown}
                </pre>
              </div>

              <div className="min-h-[520px] overflow-auto rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-medium">Rendered Preview</h3>
                <div className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[
                      [rehypeSanitize, githubLikeSanitizeSchema],
                      rehypeHighlight,
                    ]}
                  >
                    {generatedData.markdown}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 min-h-[220px] overflow-auto rounded-lg border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">
                Belum ada markdown hasil generate.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
