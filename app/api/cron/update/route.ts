import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/encryption"
import { fetchPublicUser, fetchPublicRepos, fetchPrivateStats } from "@/lib/github-api"
import { calculateHustleScore, scoreToNaira, getAffordabilityTier, getMessage } from "@/lib/github-scoring"

export const maxDuration = 60 // Allow 60 seconds (Vercel limit for hobby/pro usually)

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Find users who haven't been updated in 24 hours
    // Limit to 50 to prevent timeouts
    const usersToUpdate = await prisma.user.findMany({
      where: {
        lastScoredAt: { lt: yesterday }
      },
      take: 50
    })
    
    const results = await Promise.allSettled(usersToUpdate.map(async (user: any) => {
        try {
            // Fetch Data
            const publicUser = await fetchPublicUser(user.username)
            const publicRepos = await fetchPublicRepos(user.username)
            
            let privateStats = undefined
            if (user.mode === "PRIVATE" && user.accessToken) {
                try {
                    const decryptedToken = decrypt(user.accessToken)
                    privateStats = await fetchPrivateStats(decryptedToken)
                } catch (e) {
                    console.error(`Error processing private stats for ${user.username}:`, e)
                    // If token invalid, maybe fallback or just ignore private stats this run
                }
            }
            
            const { score, breakdown } = calculateHustleScore(publicUser, publicRepos, privateStats)
            
            // Recalculate derived
            const nairaValue = scoreToNaira(score)
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

            // Create Snapshot
            await prisma.snapshot.create({
                data: {
                    userId: user.id,
                    score,
                    nairaValue,
                    breakdown,
                    stats
                }
            })
            
            // Update User
            await prisma.user.update({
                where: { id: user.id },
                data: { 
                    lastScoredAt: new Date(),
                    hustleScore: score
                }
            })
            
            return { username: user.username, status: "updated", score }
            
        } catch (err) {
            console.error(`Failed to update user ${user.username}`, err)
            return { username: user.username, status: "failed" }
        }
    }))
    
    const updatedCount = results.filter((r: any) => r.status === "fulfilled" && r.value.status === "updated").length

    return NextResponse.json({ 
        success: true, 
        message: `Processed ${usersToUpdate.length} users. Updated ${updatedCount}.`,
        details: results
    })

  } catch (error) {
    console.error("Cron Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
