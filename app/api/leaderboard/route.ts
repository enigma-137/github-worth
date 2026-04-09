import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic' // Disable static caching for leaderboards

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "lifetime"
  
  try {
    if (type === "lifetime") {
      const authenticatedUsers = await prisma.user.findMany({
        where: { mode: 'PUBLIC' },
        orderBy: { hustleScore: 'desc' },
        take: 50,
        select: {
          username: true,
          avatarUrl: true,
          hustleScore: true,
          mode: true,
        }
      })

      const guestUsers = await prisma.guestScore.findMany({
        orderBy: { hustleScore: 'desc' },
        take: 50,
        select: {
          username: true,
          avatarUrl: true,
          hustleScore: true,
        }
      })
      
      // Combine and mark guests
      const combined = [
        ...authenticatedUsers.map((u: any) => ({ ...u, change: 0 })),
        ...guestUsers.map((u: any) => ({ 
           ...u, 
           mode: 'GUEST', // Virtual mode for frontend
           change: 0 
        }))
      ]

      // Sort by score and take top 50, ensuring no duplicate usernames
      // (The githworth logic should prevent most, but this is a safety net)
      const ranked = Array.from(
        new Map(combined.map((u: any) => [u.username.toLowerCase(), u])).values()
      )
      .sort((a: any, b: any) => b.hustleScore - a.hustleScore)
      .slice(0, 50)
      
      return NextResponse.json(ranked)
    } 
    
    // Growth Leaderboards
    const days = type === "monthly" ? 30 : 7
    const now = new Date()
    const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    // Fetch users who have been active/scored recently (optimization)
    // We strictly need users who HAVE a snapshot older than 'days' to treat it as growth
    // But simplest is to fetch users and their recent snapshots history
    
    const users = await prisma.user.findMany({
      where: {
         snapshots: { some: {} } // Must have at least one snapshot
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        hustleScore: true,
        mode: true,
        snapshots: {
           where: {
             createdAt: {
               lte: pastDate, // Get snapshots OLDER than x days
             }
           },
           orderBy: { createdAt: 'desc' },
           take: 1
        }
      }, 
      // We can't sort by computed field in DB easily with Prisma+Mongo here
      take: 1000 // Limit to 1000 candidates for memory safety
    })
    
    const ranked = users.map((user: any) => {
       const pastSnapshot = user.snapshots[0]
       // If no past snapshot, growth is technically all of it? Or 0?
       // Usually growth implies "Change". If they just joined today, change is 0 or undefined.
       // Let's say if no past snapshot > 7 days, we look for OLDEST snapshot?
       // For now, if no snapshot <= 7 days ago, we assume 0 growth or exclude.
       const previousScore = pastSnapshot ? pastSnapshot.score : user.hustleScore // If no old history, maybe 0 change?
       
       // If they joined < 7 days ago, previousScore might be their first score.
       // Let's refine:
       // If no snapshot exists OLDER than 7 days, try to find the oldest snapshot period.
       // But my query filtered snapshots older than 7 days.
       // If empty, it means they are new (<7 days). So Growth = hustleScore - (First Snapshot Score).
       // This logic is getting complex for a single query.
       
       // Simplification:
       // Growth = Current Score - Score at T-7.
       // If no score at T-7, exclude or use 0? 
       // Prompt says: "Rank by score increase".
       
       if (!pastSnapshot) return null 
       
       const change = user.hustleScore - pastSnapshot.score
       return {
         username: user.username,
         avatarUrl: user.avatarUrl,
         hustleScore: user.hustleScore,
         mode: user.mode,
         change,
       }
    })
    .filter((u: any): u is NonNullable<typeof u> => u !== null && u.change > 0)
    .sort((a: any, b: any) => b.change - a.change)
    .slice(0, 50)
    
    return NextResponse.json(ranked)

  } catch (error: any) {
    console.error("Leaderboard Error Detailed:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    return NextResponse.json({ 
      error: "Failed to fetch leaderboard",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 })
  }
}
