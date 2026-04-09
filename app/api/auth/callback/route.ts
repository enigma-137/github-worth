import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const mode = (searchParams.get('mode') as 'PUBLIC' | 'PRIVATE') || 'PUBLIC'

  if (!code) {
    console.error("No code provided in callback")
    return NextResponse.redirect(`${origin}/?error=no_code_provided`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error) {
    console.error("Supabase exchange error:", error.message)
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`)
  }

  if (!data.user) {
    console.error("No user found in session after exchange")
    return NextResponse.redirect(`${origin}/?error=user_not_found`)
  }

  const user = data.user
  const identity = user.identities?.find(id => id.provider === 'github')
  
  // Try multiple locations for the GitHub ID
  const rawGitHubId = 
    user.user_metadata.provider_id || 
    user.app_metadata.provider_id || 
    identity?.identity_id || 
    identity?.identity_data?.sub ||
    "0"
  
  const githubId = parseInt(rawGitHubId as string)
  const username = user.user_metadata.user_name || user.user_metadata.preferred_username || "unknown"
  const avatarUrl = user.user_metadata.avatar_url || ""
  const name = user.user_metadata.full_name || username
  const bio = user.user_metadata.bio || null
  const accessToken = data.session?.provider_token

  try {
    console.log(`Syncing user to DB: ${username} (GitHub ID: ${githubId}, Mode: ${mode})`)
    
    await prisma.user.upsert({
      where: { githubId: githubId },
      update: {
        id: user.id, // Update to current Supabase ID if it changed
        username,
        avatarUrl,
        name,
        bio,
        accessToken,
        mode,
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        githubId,
        username,
        avatarUrl,
        name,
        bio,
        accessToken,
        mode,
      },
    })
  } catch (dbError: any) {
    console.error("Database sync error:", dbError.message)
    // Redirect with error details for debugging
    return NextResponse.redirect(`${origin}/?error=database_sync_failed&details=${encodeURIComponent(dbError.message)}`)
  }

  // Handle Redirection
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  
  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`)
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`)
  } else {
    // Fallback to configured app URL if origin is unreliable in prod
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
    return NextResponse.redirect(`${appUrl}${next}`)
  }
}
