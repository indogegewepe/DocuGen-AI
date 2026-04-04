![DocuGen AI](https://raw.githubusercontent.com/indogegewepe/DocuGen-AI/refs/heads/master/public/DocuGenAI.jpeg)

# 🚀 DocuGen AI

**AI-Powered Documentation Generator**  
Generate dokumentasi proyek secara otomatis dari repository atau input pengguna — cepat, rapi, dan siap pakai.

---

## 📌 Overview

**DocuGen AI** adalah aplikasi berbasis AI yang membantu developer menghasilkan dokumentasi (README, technical docs, dll.) secara otomatis dari repository atau input teks.

Frontend ini dibangun menggunakan **Next.js modern (App Router)** dengan fokus pada:
- ⚡ Performa tinggi
- 🧠 Integrasi AI yang seamless
- 🎯 Developer Experience yang optimal
- 📄 Output Markdown yang clean & ready

---

## ✨ Key Features

- 🤖 **AI Documentation Generator**  
  Generate README atau dokumentasi secara otomatis dari input repository atau teks

- 📝 **Live Markdown Preview**  
  Preview hasil dokumentasi secara real-time dengan rendering yang aman

- 🎨 **Modern UI/UX**  
  Dibangun dengan `shadcn/ui` + Tailwind CSS untuk tampilan clean & responsif

- ✅ **Type-safe Form Validation**  
  Validasi menggunakan React Hook Form
  
---

## 🧠 How It Works

1. User memasukkan:
   - URL repository

2. Frontend mengirim request ke backend AI

3. Backend memproses & menghasilkan:
   - README yang lebih terstruktur
   - Markdown yang clean

4. Hasil ditampilkan & bisa:
   - Dipreview

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript, React 19 |
| **UI & Styling** | Tailwind CSS v4, shadcn/ui |
| **Markdown Engine** | react-markdown, remark-gfm, rehype-highlight |
| **Utilities** | lucide-react, sonner, file-saver |
| **Tooling** | ESLint, Prettier, Turbopack |

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

## ☕ Support Me

[![Trakteer](https://img.shields.io/badge/Support-Trakteer-red?style=for-the-badge&logo=buymeacoffee)](https://teer.id/tsqh)

Terima kasih atas dukungannya!

## 📄 Lisensi

Proyek ini dilisensikan di bawah [Lisensi MIT](LICENSE). Silakan lihat file `LICENSE` untuk detail lebih lanjut.

---

## 📞 Kontak & Dukungan

- 🐛 **Laporan Bug:** [GitHub Issues](https://github.com/indogegewepe/DocuGen-AI/issues)
- 💬 **Diskusi:** [GitHub Discussions](https://github.com/indogegewepe/DocuGen-AI/discussions)
- 📧 **Email:** bagasuwaidha007@gmail.com
