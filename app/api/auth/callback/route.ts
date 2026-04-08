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
    if (error) {
      console.error("Supabase exchange error:", error.message)
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`)
    }

    if (data.user) {
      const user = data.user
      // ... existing logging ...
      
      try {
        await prisma.user.upsert({
          // ... existing upsert logic ...
        })
      } catch (dbError: any) {
        console.error("Database sync error:", dbError.message)
        // Return a more descriptive error in development, or a redirect with details in prod
        return NextResponse.redirect(`${origin}/?error=database_sync_failed&details=${encodeURIComponent(dbError.message)}`)
      }

      // ... existing redirect logic ...
    }
  }

  return NextResponse.redirect(`${origin}/?error=no_code_provided`)
}
