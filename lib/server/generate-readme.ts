const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

const MARKDOWN_TUTORIAL_CONTEXT = `
Konteks tambahan penulisan markdown:
- Hapuskan semua tag markdown fence yang tidak perlu. Output harus langsung berupa markdown siap pakai.
- Gunakan heading yang jelas dan hierarkis (#, ##, ###).
- Gunakan style teks seperlunya: bold, italic, strikethrough.
- Gunakan list yang rapi: numbered, bullet, dan task list jika relevan.
- Gunakan quote, inline code, dan block code untuk contoh perintah.
- Gunakan horizontal line (---) sebagai pembatas section bila dibutuhkan.
- Gunakan link dengan format [teks](url) yang valid.
- Gunakan tabel markdown saat menyajikan data komparatif.
- Gunakan image markdown atau HTML hanya jika benar-benar menambah konteks.
- Utamakan keterbacaan, konsistensi format, dan siap pakai untuk README GitHub.
`.trim()

function toJsonBlock(value: unknown, maxChars = 6000): string {
  const rendered = JSON.stringify(value, null, 2)
  if (rendered.length <= maxChars) return rendered
  return `${rendered.slice(0, maxChars)}\n... (truncated)`
}

function detectProjectContext(configs: Record<string, unknown>, readmePreview: string | null): string {
  const keys = new Set(Object.keys(configs).map((key) => key.toLowerCase()))
  const composer = configs["composer.json"]

  const frameworks: string[] = []
  const requiredSections: string[] = []

  if (composer && typeof composer === "object" && !Array.isArray(composer)) {
    const requireMap = (composer as Record<string, unknown>).require
    if (requireMap && typeof requireMap === "object" && !Array.isArray(requireMap)) {
      const deps = new Set(Object.keys(requireMap).map((dep) => dep.toLowerCase()))
      if (deps.has("laravel/framework")) {
        frameworks.push("PHP Laravel")
        requiredSections.push(
          "Prasyarat: versi PHP, Composer, ekstensi penting",
          "Setup Laravel: copy .env, generate APP_KEY, konfigurasi database",
          "Perintah umum: composer install, php artisan migrate, php artisan serve"
        )
      }
    }
  }

  if (keys.has("package.json")) {
    frameworks.push("Node.js/JavaScript")
    requiredSections.push("Script npm/yarn/bun yang tersedia dan cara menjalankannya")
  }
  if (keys.has("pyproject.toml") || keys.has("requirements.txt")) {
    frameworks.push("Python")
    requiredSections.push("Setup virtual environment dan perintah instalasi dependency")
  }
  if (keys.has("go.mod")) {
    frameworks.push("Go")
    requiredSections.push("Cara build dan run aplikasi Go")
  }
  if (keys.has("cargo.toml")) {
    frameworks.push("Rust")
    requiredSections.push("Perintah cargo build/test/run")
  }
  if (keys.has("pom.xml")) {
    frameworks.push("Java Maven")
    requiredSections.push("Cara build/test/package dengan Maven")
  }

  if (!frameworks.length && readmePreview) {
    const previewLower = readmePreview.toLowerCase()
    if (previewLower.includes("laravel") || previewLower.includes("artisan")) {
      frameworks.push("PHP Laravel")
    }
  }

  const frameworkLine = frameworks.length
    ? [...new Set(frameworks)].join(", ")
    : "Belum terdeteksi pasti"

  const uniqueSections = [...new Set(requiredSections)]
  const sectionsLine = uniqueSections.length
    ? uniqueSections.map((item) => `- ${item}`).join("\n")
    : "- Sesuaikan section setup dengan teknologi yang terdeteksi dari repo."

  return `Teknologi/framework terdeteksi: ${frameworkLine}\nSection penting yang wajib diprioritaskan:\n${sectionsLine}`
}

export async function generateReadmeSuggestion(
  repoName: string,
  readmePreview: string | null,
  configs: Record<string, unknown>
): Promise<string> {
  const payload = buildReadmePayload(repoName, readmePreview, configs)

  const response = await openReadmeStreamRequest(payload, false)

  const bodyText = await response.text()
  if (!response.ok) {
    throw new Error(`OpenRouter HTTP error ${response.status}: ${bodyText}`)
  }

  let data: unknown
  try {
    data = JSON.parse(bodyText)
  } catch {
    throw new Error("Respons OpenRouter bukan JSON valid.")
  }

  const choices = (data as { choices?: Array<{ message?: { content?: unknown } }> }).choices || []
  if (!choices.length) {
    throw new Error("Respons OpenRouter tidak memiliki 'choices'.")
  }

  let content = choices[0]?.message?.content || ""
  if (Array.isArray(content)) {
    content = content
      .map((part) => (part && typeof part === "object" ? String((part as { text?: unknown }).text ?? "") : String(part)))
      .join("")
  }

  const markdown = String(content).trim()
  if (!markdown) {
    throw new Error("Respons OpenRouter kosong.")
  }

  return markdown
}

type ReadmePayload = {
  model: string
  temperature: number
  stream: boolean
  messages: Array<{ role: string; content: string }>
}

export function buildReadmePayload(
  repoName: string,
  readmePreview: string | null,
  configs: Record<string, unknown>,
  stream = false
): ReadmePayload {
  const model = process.env.OPENROUTER_MODEL || "openrouter/free"
  const projectContext = detectProjectContext(configs, readmePreview)

  const userPrompt =
    "Buat README.md yang lebih baik dan profesional dalam format markdown.\n" +
    `Nama repo: ${repoName}\n\n` +
    "README saat ini (jika ada):\n" +
    `${(readmePreview || "README tidak ditemukan").slice(0, 10000)}\n\n` +
    "File konfigurasi yang ditemukan:\n" +
    `${toJsonBlock(configs)}\n\n` +
    "Persyaratan output:\n" +
    "1. Output harus markdown valid.\n" +
    "2. Sertakan: Judul, Deskripsi, Tech Stack, Instalasi, Penggunaan, Struktur Proyek (jika bisa), Kontribusi, Lisensi.\n" +
    "3. Tulis langkah instalasi/usage yang relevan dengan framework terdeteksi.\n" +
    "4. Jika Laravel/PHP terdeteksi, WAJIB sertakan langkah .env, APP_KEY, konfigurasi database, migration, dan serve.\n" +
    "5. Jika ada perintah di script/config, gunakan perintah yang realistis sesuai repo.\n" +
    "6. Jika data kurang, beri placeholder yang jelas dan tidak mengarang detail sensitif.\n" +
    "7. Jangan bungkus output dengan penjelasan tambahan di luar markdown README.\n" +
    "8. Bisa diimplementasikan ke dalam README.md github secara langsung tanpa modifikasi lebih lanjut.\n" +
    "9. Tanpa menambahkan bagian 'Generated by AI' atau sejenisnya.\n" +
    "Konteks proyek terdeteksi:\n" +
    `${projectContext}\n` +
    "Konteks gaya markdown yang harus diikuti:\n" +
    MARKDOWN_TUTORIAL_CONTEXT

  return {
    model,
    temperature: 0.2,
    stream,
    messages: [
      {
        role: "system",
        content: "Kamu adalah asisten yang menulis README teknis berkualitas tinggi.",
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  }
}

export async function openReadmeStreamRequest(
  payload: ReadmePayload,
  stream: boolean,
  signal?: AbortSignal
): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY belum di-set di environment server.")
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://localhost",
      "X-Title": process.env.OPENROUTER_APP_NAME || "README Automation Tool",
    },
    body: JSON.stringify({ ...payload, stream }),
    signal,
  })

  return response
}
