import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const user = data.user
      const identity = user.identities?.find(id => id.provider === 'github')
      
      // Sync user to our database
      // The githubId and other details come from the identity/user metadata
      const githubId = parseInt(user.app_metadata.provider_id || identity?.identity_id || "0")
      const username = user.user_metadata.user_name || user.user_metadata.preferred_username
      const avatarUrl = user.user_metadata.avatar_url
      const name = user.user_metadata.full_name
      const bio = user.user_metadata.bio
      
      // Get the provider token if available (Supabase stores this in the session)
      // For GitHub, this is the access token we can use for background tasks
      const accessToken = data.session.provider_token
      const scopes = (data.session as any).provider_refresh_token ? [] : [] // Scopes are handled by Supabase

      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          username: username,
          avatarUrl: avatarUrl,
          name: name,
          bio: bio,
          accessToken: accessToken,
          updatedAt: new Date(),
        },
        create: {
          id: user.id,
          githubId: githubId,
          username: username,
          avatarUrl: avatarUrl,
          name: name,
          bio: bio,
          accessToken: accessToken,
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
