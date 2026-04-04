import { parseGithubRepoUrl } from "@/lib/server/parser"

const README_CANDIDATES = ["README.md", "README.mdown", "readme.md", "Readme.md"]

const CONFIG_CANDIDATES = [
  "composer.json",
  "phpunit.xml",
  ".env.example",
  "artisan",
  "routes/web.php",
  "config/app.php",
  "config/database.php",
  "package.json",
  "vite.config.js",
  "webpack.mix.js",
  "pyproject.toml",
  "requirements.txt",
  "setup.py",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "Gemfile",
  "docker-compose.yml",
  "Dockerfile",
]

export type RepoDataResult = {
  owner: string
  repo: string
  readmeName: string | null
  readmeBranch: string | null
  readmeContent: string | null
  configs: Record<string, unknown>
}

function rawUrl(owner: string, repo: string, branch: string, filePath: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "README-Automation-Tool/1.0",
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.text()
  } catch {
    return null
  }
}

export async function fetchRepoData(repoUrl: string): Promise<RepoDataResult> {
  const { owner, repo, branchHint } = parseGithubRepoUrl(repoUrl)

  const branchCandidates = [branchHint, "main", "master"].filter(Boolean)
  const dedupedBranches = [...new Set(branchCandidates)] as string[]

  let readmeContent: string | null = null
  let readmeName: string | null = null
  let readmeBranch: string | null = null

  for (const branch of dedupedBranches) {
    for (const candidate of README_CANDIDATES) {
      const content = await fetchText(rawUrl(owner, repo, branch, candidate))
      if (content !== null) {
        readmeContent = content
        readmeName = candidate
        readmeBranch = branch
        break
      }
    }

    if (readmeContent !== null) {
      break
    }
  }

  const configs: Record<string, unknown> = {}
  for (const configName of CONFIG_CANDIDATES) {
    for (const branch of dedupedBranches) {
      const content = await fetchText(rawUrl(owner, repo, branch, configName))
      if (content === null) {
        continue
      }

      if (configName.endsWith(".json")) {
        try {
          configs[configName] = JSON.parse(content)
        } catch {
          configs[configName] = content
        }
      } else {
        configs[configName] = content
      }
      break
    }
  }

  return {
    owner,
    repo,
    readmeName,
    readmeBranch,
    readmeContent,
    configs,
  }
}
