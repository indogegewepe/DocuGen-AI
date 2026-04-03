# DocuGen-AI

Frontend modern berbasis **Next.js** untuk generasi dokumen berbasis AI. Didesain dengan antarmuka yang responsif, mendukung rendering Markdown yang kaya, validasi form yang ketat, serta integrasi API yang seamless.

---

## 📖 Deskripsi

DocuGen-AI menyediakan antarmuka pengguna yang intuitif untuk membuat, mengedit, dan mengekspor dokumen secara otomatis. Aplikasi ini memanfaatkan ekosistem React modern dengan fokus pada performa, aksesibilitas, dan pengalaman pengembang yang optimal.

Fitur utama:
- 🎨 UI konsisten dengan `shadcn/ui` & Tailwind CSS v4
- 📝 Rendering Markdown aman dengan syntax highlighting & sanitasi
- 📊 State management & data fetching via TanStack Query
- ✅ Validasi form tipe-aman menggunakan React Hook Form & Zod
- 🌙 Dukungan tema terang/gelap (`next-themes`)
- 📥 Ekspor dokumen langsung ke perangkat (`file-saver`)

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|:---|:---|
| **Framework** | Next.js 16 (App Router) |
| **Bahasa** | TypeScript, React 19 |
| **Styling & UI** | Tailwind CSS v4, `shadcn/ui`, Radix UI, `class-variance-authority` |
| **State & Data** | TanStack Query, React Hook Form, Zod |
| **Markdown** | `react-markdown`, `remark-gfm`, `rehype-highlight`, `rehype-sanitize` |
| **Utilitas** | `lucide-react`, `sonner`, `next-themes`, `file-saver`, `github-markdown-css` |
| **Tooling** | ESLint, Prettier, Turbopack, TypeScript |

---

## 📦 Instalasi

Pastikan Anda telah menginstal **Node.js 20+** dan package manager pilihan Anda (`npm`, `pnpm`, `yarn`, atau `bun`).

1. **Clone repository**
   ```bash
   git clone https://github.com/indogegewepe/DocuGen-AI.git
   cd DocuGen-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   # atau: pnpm install / yarn install / bun install
   ```

3. **Konfigurasi Environment Variables**
   Salin template environment dan sesuaikan nilai variabel sesuai kebutuhan:
   ```bash
   cp .env.example .env.local
   ```
   Buka `.env.local` dan ubah `NEXT_PUBLIC_API_BASE_URL` ke endpoint backend Anda:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
   ```

---

## 🚀 Penggunaan

Jalankan perintah berikut sesuai kebutuhan pengembangan atau produksi:

| Perintah | Deskripsi |
|:---|:---|
| `npm run dev` | Menjalankan server development dengan **Turbopack** (`http://localhost:3000`) |
| `npm run build` | Membangun aplikasi untuk produksi |
| `npm run start` | Menjalankan server produksi |
| `npm run lint` | Memeriksa kode dengan ESLint |
| `npm run format` | Memformat kode secara otomatis menggunakan Prettier |
| `npm run typecheck` | Memvalidasi tipe TypeScript tanpa menghasilkan output |

> 💡 **Catatan:** Pastikan backend API sudah berjalan di `NEXT_PUBLIC_API_BASE_URL` sebelum melakukan request data.

---

## 📁 Struktur Proyek

```
📦 DocuGen-AI
├── 📂 app/                 # Next.js App Router (pages, layouts, API routes)
├── 📂 components/          # Komponen UI & fitur aplikasi
│   └── 📂 ui/              # Komponen dasar shadcn/ui
├── 📂 lib/                 # Utilitas, konfigurasi, & helper functions
├── 📂 hooks/               # Custom React hooks
├── 📂 public/              # Static assets (favicon, images, dll.)
├── 📂 styles/              # Global CSS & konfigurasi Tailwind
├── 📄 .env.example         # Template environment variables
├── 📄 package.json         # Dependencies & npm scripts
├── 📄 tsconfig.json        # Konfigurasi TypeScript
└── 📄 next.config.ts       # Konfigurasi Next.js
```

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Ikuti alur berikut untuk memastikan konsistensi kode:

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b fitur/nama-fitur`)
3. Commit perubahan (`git commit -m 'feat: menambahkan fitur X'`)
4. Jalankan pemeriksaan kode sebelum push:
   ```bash
   npm run lint
   npm run format
   npm run typecheck
   ```
5. Push ke branch (`git push origin fitur/nama-fitur`)
6. Buka Pull Request dengan deskripsi perubahan yang jelas

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [Lisensi MIT](LICENSE). Silakan lihat file `LICENSE` untuk detail lebih lanjut.

---

## 📞 Kontak & Dukungan

- 🐛 **Laporan Bug:** [GitHub Issues](https://github.com/indogegewepe/DocuGen-AI/issues)
- 💬 **Diskusi:** [GitHub Discussions](https://github.com/indogegewepe/DocuGen-AI/discussions)
- 📧 **Email:** [indogegewepe@example.com](mailto:indogegewepe@example.com) *(ganti dengan kontak resmi)*