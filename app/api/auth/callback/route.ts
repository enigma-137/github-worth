import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { encrypt } from "@/lib/encryption"
import { Octokit } from "octokit"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  console.log("OAuth callback start")
  console.log("State:", state)

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=missing_params", request.url))
  }

  // FIX 1: Proper state parsing
  const rawState = state
  const isPrivateMode = rawState.endsWith("_private")
  const mode = isPrivateMode ? "PRIVATE" : "PUBLIC"
  const cleanedState = rawState.replace("_private", "").replace("_public", "")

  console.log("Mode:", mode)
  console.log("Cleaned state:", cleanedState)

  // 2. Exchange Code
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000"}/api/auth/callback`

  if (!clientId || !clientSecret) {
    console.error("Missing GitHub Auth Env Vars")
    return NextResponse.redirect(new URL("/?error=config", request.url))
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()
    if (tokenData.error) {
       console.error("Token exchange error:", tokenData)
       return NextResponse.redirect(new URL("/?error=token_exchange", request.url))
    }

    const accessToken = tokenData.access_token

    // FIX 3: Store granted scopes
    const scopes = tokenData.scope?.split(",") || []
    console.log("Granted scopes:", scopes)
    const hasPrivateAccess = scopes.includes("repo")

    // 3. Get User Profile
    const octokit = new Octokit({ auth: accessToken })
    const { data: userProfile } = await octokit.request("GET /user")

    // 4. Encrypt Token
    const encryptedToken = encrypt(accessToken)

    // Security: Guard against encryption failure
    if (!encryptedToken) {
      throw new Error("Token encryption failed")
    }

    // 5. Upsert User
    const user = await prisma.user.upsert({
      where: { githubId: userProfile.id },
      update: {
        username: userProfile.login,
        avatarUrl: userProfile.avatar_url,
        name: userProfile.name,
        bio: userProfile.bio,
        accessToken: encryptedToken,
        mode: mode,
        grantedScopes: scopes,
        updatedAt: new Date(),
      },
      create: {
        githubId: userProfile.id,
        username: userProfile.login,
        avatarUrl: userProfile.avatar_url,
        name: userProfile.name,
        bio: userProfile.bio,
        accessToken: encryptedToken,
        mode: mode,
        grantedScopes: scopes,
      },
    })

    console.log("User ID type:", typeof user.id, user.id)

    // 6. Set Session Cookie
    // FIX 2: Convert ObjectId to string before encrypting
    const sessionToken = encrypt(user.id.toString())

    const response = NextResponse.redirect(new URL("/", request.url))
    
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
    })

    return response

  } catch (err: any) {
    console.error("Auth Error:", err)
    const errorMessage = encodeURIComponent(err.message || "Unknown error")
    return NextResponse.redirect(new URL(`/?error=auth_failed&details=${errorMessage}`, request.url))
  }
}
