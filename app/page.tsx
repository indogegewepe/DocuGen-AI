"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  generateReadmeStream,
  type GenerateResponse,
  type PreviewResponse,
} from "@/lib/api"

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
  type GenerateStage =
    | "idle"
    | "validating"
    | "preparing"
    | "streaming"
    | "finalizing"
    | "done"

  const [repoUrl, setRepoUrl] = useState("")
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
  const [generatedData, setGeneratedData] = useState<GenerateResponse | null>(null)
  const [streamingMarkdown, setStreamingMarkdown] = useState("")
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [generateStage, setGenerateStage] = useState<GenerateStage>("idle")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const previewAbortRef = useRef<AbortController | null>(null)
  const generateAbortRef = useRef<AbortController | null>(null)
  const generateStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (!loadingGenerate) return

    const timer = window.setInterval(() => {
      if (!generateStartRef.current) return
      const delta = Date.now() - generateStartRef.current
      setElapsedSeconds(Math.floor(delta / 1000))
    }, 500)

    return () => window.clearInterval(timer)
  }, [loadingGenerate])

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

      previewAbortRef.current?.abort()
      const controller = new AbortController()
      previewAbortRef.current = controller

      const data = await fetchPreview(repoUrl.trim(), controller.signal)
      setPreviewData(data)
      toast.success("Preview README berhasil diambil")
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return
      }
      const message = err instanceof Error ? err.message : "Preview gagal"
      setError(message)
      toast.error(message)
    } finally {
      setLoadingPreview(false)
    }
  }

  const generateButtonLabel = loadingGenerate ? "Generating..." : "Generate README"

  function handleCancelGenerate() {
    generateAbortRef.current?.abort()
    setLoadingGenerate(false)
    setGenerateStage("idle")
    generateStartRef.current = null
    setElapsedSeconds(0)
    toast.info("Generate dibatalkan")
  }

  async function handleGenerate() {
    if (!canSubmit) {
      setError("URL harus format GitHub publik yang valid")
      return
    }

    try {
      setGenerateStage("validating")
      setError(null)
      setLoadingGenerate(true)
      setStreamingMarkdown("")
      setGeneratedData(null)
      setElapsedSeconds(0)
      generateStartRef.current = Date.now()

      generateAbortRef.current?.abort()
      const controller = new AbortController()
      generateAbortRef.current = controller

      let latestMeta: Omit<GenerateResponse, "markdown"> | null = null

      setGenerateStage("preparing")

      await generateReadmeStream(repoUrl.trim(), {
        signal: controller.signal,
        onMeta: (meta) => {
          setGenerateStage("streaming")
          latestMeta = meta
          setPreviewData({
            status: meta.status,
            message: meta.message,
            preview: meta.preview,
            configs: meta.configs,
            repo: meta.repo,
            dataDiambil: meta.dataDiambil,
          })
        },
        onDelta: (chunk) => {
          setStreamingMarkdown((prev) => prev + chunk)
        },
        onDone: (markdown) => {
          if (!latestMeta) {
            throw new Error("Metadata generate tidak tersedia.")
          }

          setGenerateStage("finalizing")

          setGeneratedData({
            ...latestMeta,
            markdown,
          })

          setGenerateStage("done")
        },
      })

      toast.success("README markdown berhasil di-generate")
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return
      }
      const message = err instanceof Error ? err.message : "Generate gagal"
      setError(message)
      toast.error(message)
    } finally {
      setLoadingGenerate(false)
      setGenerateStage("idle")
      generateStartRef.current = null
    }
  }

  async function handleCopyMarkdown() {
    const content = generatedData?.markdown || streamingMarkdown
    if (!content) return
    await navigator.clipboard.writeText(content)
    toast.success("Markdown disalin")
  }

  const displayedMarkdown = loadingGenerate
    ? streamingMarkdown
    : (generatedData?.markdown ?? "")

  const steps = [
    { key: "validating", label: "Validasi URL repository" },
    { key: "preparing", label: "Ambil README & konfigurasi" },
    { key: "streaming", label: "AI menulis README" },
    { key: "finalizing", label: "Finalisasi hasil" },
  ] as const

  function getStepStatus(step: (typeof steps)[number]["key"]) {
    const order: Record<GenerateStage, number> = {
      idle: -1,
      validating: 0,
      preparing: 1,
      streaming: 2,
      finalizing: 3,
      done: 4,
    }

    const current = order[generateStage]
    const target = order[step]
    if (current > target || generateStage === "done") return "done"
    if (current === target) return "active"
    return "pending"
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

          <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
            <Input
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder="https://github.com/owner/repo"
              disabled={loadingGenerate}
            />
            <Button
              onClick={handlePreview}
              disabled={loadingPreview || loadingGenerate}
              variant="outline"
            >
              {loadingPreview ? "Loading..." : "Preview"}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loadingGenerate}
            >
              {generateButtonLabel}
            </Button>
            {loadingGenerate ? (
              <Button onClick={handleCancelGenerate} variant="destructive">
                Cancel
              </Button>
            ) : null}
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <div className="p-2 md:p-4">
              <AlertTitle>Terjadi masalah</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {loadingGenerate ? (
          <Alert>
            <div className="p-2 md:p-4">
              <AlertTitle>Generating...</AlertTitle>
              <AlertDescription>
                Sedang memproses repository dan menghasilkan README dengan AI.
                {" "}
                <strong>({elapsedSeconds}s)</strong>
              </AlertDescription>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-muted">
                <div className="h-full w-1/3 animate-pulse rounded bg-primary" />
              </div>
              <div className="mt-3 grid gap-1 text-xs">
                {steps.map((step) => {
                  const status = getStepStatus(step.key)
                  return (
                    <div key={step.key} className="flex items-center gap-2">
                      <span className="inline-block w-4 text-center">
                        {status === "done" ? "✓" : status === "active" ? "•" : "○"}
                      </span>
                      <span className={status === "active" ? "font-medium" : "text-muted-foreground"}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
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
              disabled={!displayedMarkdown}
              variant="secondary"
              size="sm"
            >
              Copy Markdown
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Hasil final dari endpoint generate backend.
          </p>

          {displayedMarkdown ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="min-h-[520px] overflow-auto rounded-lg border bg-muted/40 p-4">
                <h3 className="mb-2 text-sm font-medium">Raw Markdown</h3>
                <pre className="text-xs whitespace-pre-wrap">
                  {displayedMarkdown}
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
                    {displayedMarkdown}
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
