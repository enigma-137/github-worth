import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { fetchPublicRepos, fetchPrivateStats, fetchPublicUser } from "@/lib/github-api"
import { calculateHustleScore, scoreToNaira, getAffordabilityTier, getMessage, GitHubWorthResult } from "@/lib/github-scoring"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 1 } }
    })

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const githubToken = user.accessToken
    
    // FETCH FRESH DATA
    const publicUser = await fetchPublicUser(user.username)
    const publicRepos = await fetchPublicRepos(user.username)
    
    let privateStats = undefined
    if (user.mode === "PRIVATE" && githubToken) {
       try {
         privateStats = await fetchPrivateStats(githubToken)
       } catch (e) {
         console.error("Failed to fetch private stats", e)
       }
    }

    const { score, breakdown } = calculateHustleScore(publicUser, publicRepos, privateStats)
    
    // Save Snapshot logic
    const lastSnapshot = user.snapshots[0]
    const oneDay = 24 * 60 * 60 * 1000
    const shouldSnapshot = !lastSnapshot || (new Date().getTime() - lastSnapshot.createdAt.getTime() > oneDay)

    const nairaValue = scoreToNaira(score)
    const affordabilityTier = getAffordabilityTier(nairaValue)
    const message = getMessage(score)
    
    const stats = {
        followers: publicUser.followers,
        totalStars: publicRepos.reduce((acc: number, r: any) => acc + r.stargazers_count, 0),
        totalForks: publicRepos.reduce((acc: number, r: any) => acc + r.forks_count, 0),
        publicRepos: publicUser.public_repos,
        originalRepos: publicRepos.filter((r: any) => !r.fork).length,
        activeRepos: publicRepos.filter((r: any) => !r.archived).length,
        languages: [...new Set(publicRepos.map((r: any) => r.language).filter(Boolean))] as string[],
        accountAgeDays: Math.floor((new Date().getTime() - new Date(publicUser.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        privateRepos: privateStats?.privateRepos,
        privateContributions: privateStats?.privateContributions
    }

    if (shouldSnapshot) {
       await prisma.snapshot.create({
         data: {
           userId: user.id,
           score,
           nairaValue,
           breakdown,
           stats,
         }
       })
    }
    
    // Update user lastScoredAt and hustleScore
    await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastScoredAt: new Date(),
          hustleScore: score
        }
    })

    const result: GitHubWorthResult = {
        username: user.username,
        avatarUrl: user.avatarUrl,
        name: user.name,
        bio: user.bio,
        profileUrl: publicUser.html_url,
        hustleScore: score,
        nairaValue,
        affordabilityTier,
        message,
        breakdown,
        stats,
        isPrivateMode: user.mode === "PRIVATE"
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error("Error in /me:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
