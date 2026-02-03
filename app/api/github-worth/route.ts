import { NextResponse } from "next/server"
import {
  calculateHustleScore,
  scoreToNaira,
  getAffordabilityTier,
  getMessage,
  type GitHubUser,
  type GitHubRepo,
  type GitHubWorthResult,
} from "@/lib/github-scoring"

// Simple in-memory cache
const cache = new Map<string, { data: GitHubWorthResult; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    )
  }

  // Check cache
  const cached = cache.get(username.toLowerCase())
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data)
  }

  try {
    // Fetch user data
    const userResponse = await fetch(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          }),
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )

    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        return NextResponse.json(
          { error: "GitHub user not found" },
          { status: 404 }
        )
      }
      if (userResponse.status === 403) {
        return NextResponse.json(
          { error: "API rate limit exceeded. Please try again later." },
          { status: 429 }
        )
      }
      throw new Error(`GitHub API error: ${userResponse.status}`)
    }

    const user: GitHubUser = await userResponse.json()

    // Fetch repositories (up to 100)
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          }),
        },
        next: { revalidate: 300 },
      }
    )

    if (!reposResponse.ok) {
      throw new Error(`GitHub API error: ${reposResponse.status}`)
    }

    const repos: GitHubRepo[] = await reposResponse.json()

    // Calculate score
    const { score, breakdown } = calculateHustleScore(user, repos)
    const nairaValue = scoreToNaira(score)
    const affordabilityTier = getAffordabilityTier(nairaValue)
    const message = getMessage(score)

    // Calculate stats
    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const originalRepos = repos.filter((r) => !r.fork && !r.archived)
    const activeRepos = repos.filter(
      (r) => new Date(r.updated_at) > ninetyDaysAgo && !r.archived
    )
    const languages = [
      ...new Set(repos.map((r) => r.language).filter(Boolean)),
    ] as string[]
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0)
    const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0)
    const accountAgeDays = Math.floor(
      (now.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    const result: GitHubWorthResult = {
      username: user.login,
      avatarUrl: user.avatar_url,
      name: user.name,
      bio: user.bio,
      profileUrl: user.html_url,
      hustleScore: score,
      nairaValue,
      affordabilityTier,
      message,
      breakdown,
      stats: {
        followers: user.followers,
        totalStars,
        totalForks,
        publicRepos: user.public_repos,
        originalRepos: originalRepos.length,
        activeRepos: activeRepos.length,
        languages,
        accountAgeDays,
      },
    }

    // Cache the result
    cache.set(username.toLowerCase(), { data: result, timestamp: Date.now() })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching GitHub data:", error)
    return NextResponse.json(
      { error: "Failed to fetch GitHub data. Please try again." },
      { status: 500 }
    )
  }
}
