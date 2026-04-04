import { NextResponse } from "next/server"

import { fetchRepoData } from "@/lib/server/fetch-repo-data"

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

    return NextResponse.json({
      status: "ok",
      message: "Preview README berhasil diambil",
      preview: repoData.readmeContent || "README tidak ditemukan",
      configs: repoData.configs,
      repo: `${repoData.owner}/${repoData.repo}`,
      dataDiambil: {
        readmeName: repoData.readmeName,
        readmeBranch: repoData.readmeBranch,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview gagal diproses"
    const status = /valid|github\.com/i.test(message) ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
