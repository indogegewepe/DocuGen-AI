export type ParsedGithubRepo = {
  owner: string
  repo: string
  branchHint: string | null
}

export function parseGithubRepoUrl(repoUrl: string): ParsedGithubRepo {
  let url: URL
  try {
    url = new URL(repoUrl.trim())
  } catch {
    throw new Error("URL repository tidak valid.")
  }

  if (!/(^|\.)github\.com$/i.test(url.hostname)) {
    throw new Error("URL harus dari github.com.")
  }

  const segments = url.pathname.split("/").filter(Boolean)
  if (segments.length < 2) {
    throw new Error("Format URL repository GitHub tidak valid.")
  }

  const owner = decodeURIComponent(segments[0])
  const repo = decodeURIComponent(segments[1]).replace(/\.git$/i, "")

  if (!owner || !repo) {
    throw new Error("Owner atau nama repository tidak valid.")
  }

  let branchHint: string | null = null
  const treeIndex = segments.findIndex((segment) => segment === "tree")
  if (treeIndex >= 0 && segments[treeIndex + 1]) {
    branchHint = decodeURIComponent(segments[treeIndex + 1])
  }

  return { owner, repo, branchHint }
}
