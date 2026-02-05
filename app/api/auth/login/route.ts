import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includePrivate = searchParams.get("private") === "true"
  
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GitHub Client ID not configured" }, { status: 500 })
  }

  // Scopes: 'repo' is needed for private statistics. 'read:user' for basic profile.
  const scope = includePrivate ? "read:user repo" : "read:user"
  const state = crypto.randomBytes(16).toString("hex") + (includePrivate ? "_private" : "_public")
  
  // Base URL for callback
  // In production, ensure this matches your GitHub App settings
  // defaulting to localhost for dev
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "http://localhost:3000"
  const redirectUri = `${baseUrl}/api/auth/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    allow_signup: "true",
  })

  // Set state cookie to verify later (CSRF protection)
  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
  
  // Set httpOnly cookie for state
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  })

  return response
}
