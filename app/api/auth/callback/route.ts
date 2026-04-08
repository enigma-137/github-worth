import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/'
  const mode = (searchParams.get('mode') as 'PUBLIC' | 'PRIVATE') || 'PUBLIC'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const user = data.user
      console.log("=== Auth Callback User Info ===")
      console.log("User metadata:", user.user_metadata)
      console.log("App metadata:", user.app_metadata)
      
      const identity = user.identities?.find(id => id.provider === 'github')
      console.log("GitHub Identity data:", identity?.identity_data)
      
      // Sync user to our database
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
      
      console.log(`Syncing user: ${username} (GitHub ID: ${githubId}, Mode: ${mode})`)

      if (isNaN(githubId) || githubId === 0) {
        console.error("Invalid githubId extracted, check logs above.")
      }
      
      const accessToken = data.session?.provider_token
      
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          username,
          avatarUrl,
          name,
          bio,
          accessToken,
          mode, // Update mode if they logged in with different intent
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

      const forwardedHost = request.headers.get('x-forwarded-host') // observed dampness
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that origin is the same as the site we want to redirect to
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
