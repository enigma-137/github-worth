import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includePrivate = searchParams.get("private") === "true"
  
  const supabase = await createClient()
  
  // Scopes: 'repo' is needed for private statistics. 'read:user' for basic profile.
  const scopes = includePrivate ? "read:user repo" : "read:user"
  const next = searchParams.get('next') ?? '/'
  
  const headerList = await headers()
  const host = headerList.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const redirectTo = `${protocol}://${host}/api/auth/callback?next=${next}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      scopes,
      redirectTo,
    },
  })

  if (error) {
    console.error('Login error:', error)
    return redirect(`/?error=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    return redirect(data.url)
  }

  return redirect('/?error=Could not initiate login')
}
