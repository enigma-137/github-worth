import { Octokit } from "octokit"
import { GitHubUser, GitHubRepo, PrivateStats } from "./github-scoring"

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // For higher rate limits on public calls
})

export async function fetchPublicUser(username: string): Promise<GitHubUser> {
  const { data } = await octokit.request("GET /users/{username}", {
    username,
  })
  
  // Map to our interface (subset of API response)
  return {
    login: data.login,
    avatar_url: data.avatar_url,
    name: data.name,
    bio: data.bio,
    public_repos: data.public_repos,
    followers: data.followers,
    following: data.following,
    public_gists: data.public_gists,
    created_at: data.created_at,
    html_url: data.html_url,
  }
}

export async function fetchPublicRepos(username: string): Promise<GitHubRepo[]> {
  // Fetch up to 100 most recent updated repos
  const { data } = await octokit.request("GET /users/{username}/repos", {
    username,
    per_page: 100,
    sort: "updated",
    direction: "desc",
  })
  
  return data.map((repo: any) => ({
    name: repo.name,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    language: repo.language,
    size: repo.size,
    updated_at: repo.updated_at,
    archived: repo.archived,
    fork: repo.fork,
  }))
}

export async function fetchPrivateStats(accessToken: string): Promise<PrivateStats> {
  // Use a fresh Octokit instance with the user's token
  const userOctokit = new Octokit({
    auth: accessToken,
  })

  // GraphQL query to get private contribution count and private repo count
  const query = `
    query {
      viewer {
        createdAt
        contributionsCollection {
          contributionCalendar {
            totalContributions
          }
        }
        repositories(privacy: PRIVATE, first: 1, ownerAffiliations: OWNER) {
          totalCount
        }
      }
    }
  `

  try {
    const response: any = await userOctokit.graphql(query)
    const viewer = response.viewer
    
    return {
      privateRepos: viewer.repositories.totalCount,
      privateContributions: viewer.contributionsCollection.contributionCalendar.totalContributions,
      createdAt: viewer.createdAt,
    }
  } catch (error) {
    console.error("Error fetching private stats:", error)
    throw new Error("Failed to fetch private GitHub data")
  }
}
