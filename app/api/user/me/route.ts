import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"
import { decrypt, encrypt } from "@/lib/encryption"
import { fetchPublicRepos, fetchPrivateStats, fetchPublicUser } from "@/lib/github-api"
import { calculateHustleScore, scoreToNaira, getAffordabilityTier, getMessage, GitHubWorthResult } from "@/lib/github-scoring"

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session_token")?.value

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userId = decrypt(sessionToken)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 1 } } // Get latest snapshot
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if we need to recalculate (e.g., if no snapshot or last one is > 24h old?)
    // For now, let's always calculate fresh for the user view to ensure "Connect" feels instant.
    // Or at least if the mode is PRIVATE and we expect private stats.
    
    const decryptedToken = user.accessToken ? decrypt(user.accessToken) : null
    
    // FETCH FRESH DATA
    // We fetch public data again
    const publicUser = await fetchPublicUser(user.username)
    const publicRepos = await fetchPublicRepos(user.username)
    
    let privateStats = undefined
    if (user.mode === "PRIVATE" && decryptedToken) {
       try {
         privateStats = await fetchPrivateStats(decryptedToken)
       } catch (e) {
         console.error("Failed to fetch private stats", e)
         // Fallback to public only if token fails (e.g. revoked)
       }
    }

    const { score, breakdown } = calculateHustleScore(publicUser, publicRepos, privateStats)
    
    // Create new snapshot if score changed significantly or it's a new day? 
    // Let's just create a snapshot for every "Check" action by the user themselves, 
    // but maybe limit frequency? 
    // The prompt says "Recalculation Timing: Background job... Daily snapshot".
    // So we shouldn't spam snapshots.
    // We update the User's lastScoredAt.
    
    // Save Snapshot if it's been more than 24h or if it's the first time
    const lastSnapshot = user.snapshots[0]
    const oneDay = 24 * 60 * 60 * 1000
    const shouldSnapshot = !lastSnapshot || (new Date().getTime() - lastSnapshot.createdAt.getTime() > oneDay)

    const nairaValue = scoreToNaira(score)
    const affordabilityTier = getAffordabilityTier(nairaValue)
    const message = getMessage(score)
    
    // Derived stats
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
           breakdown, // Json
           stats,      // Json
         }
       })
    }
    
    // Update user lastScoredAt
    await prisma.user.update({
        where: { id: user.id },
        data: { lastScoredAt: new Date() }
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
