import { Mode } from "@prisma/client"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { encrypt } from "@/lib/encryption"
import { Octokit } from "octokit"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  console.log("=== OAuth callback start ===")
  console.log("State:", state)
  console.log("Code:", code?.substring(0, 10) + "...")

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=missing_params", request.url))
  }

  // Parse state
  const rawState = state
  const isPrivateMode = rawState.endsWith("_private")
  const mode = isPrivateMode ? Mode.PRIVATE : Mode.PUBLIC
  const cleanedState = rawState.replace("_private", "").replace("_public", "")

  console.log("Mode:", mode)
  console.log("Cleaned state:", cleanedState)

  
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000"}/api/auth/callback`

  // console.log("Redirect URI:", redirectUri)
  // console.log("Client ID exists:", !!clientId)
  // console.log("Client Secret exists:", !!clientSecret)

  if (!clientId || !clientSecret) {
    console.error("Missing GitHub Auth Env Vars")
    return NextResponse.redirect(new URL("/?error=config", request.url))
  }

  try {
    // console.log("Step 1: Exchanging code for token...")
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
    console.log("Token response status:", tokenResponse.status)
    console.log("Token data keys:", Object.keys(tokenData))
    
    if (tokenData.error) {
       console.error("Token exchange error:", tokenData)
       return NextResponse.redirect(new URL("/?error=token_exchange", request.url))
    }

    const accessToken = tokenData.access_token
    console.log("Access token exists:", !!accessToken)

    // Parse scopes (space-separated, not comma)
    const scopes = tokenData.scope 
      ? tokenData.scope.split(/\s+/).filter(Boolean) 
      : []
    console.log("Granted scopes:", scopes)

    // console.log("Step 2: Fetching user profile...")
    const octokit = new Octokit({ auth: accessToken })
    const { data: userProfile } = await octokit.request("GET /user")
    console.log("User profile:", {
      id: userProfile.id,
      login: userProfile.login,
      name: userProfile.name
    })

    // console.log("Step 3: Encrypting token...")
    const encryptedToken = encrypt(accessToken)
    if (!encryptedToken) {
      throw new Error("Token encryption failed")
    }
    // console.log("Token encrypted successfully")

    // console.log("Step 4: Upserting user to database...")
    // console.log("Upsert data:", {
    //   githubId: userProfile.id,
    //   username: userProfile.login,
    //   mode: mode,
    //   scopesCount: scopes.length
    // })

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

    // console.log("User upserted:", user.id)

    // console.log("Step 5: Creating session...")
    const sessionToken = encrypt(user.id.toString())
    if (!sessionToken) {
      throw new Error("Session encryption failed")
    }
    console.log("Session token created")

    const response = NextResponse.redirect(new URL("/", request.url))
    
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    })

    // console.log("=== OAuth callback SUCCESS ===")
    return response

  } catch (err: any) {
    console.error("=== AUTH ERROR ===")
    console.error("Error name:", err.name)
    console.error("Error message:", err.message)
    console.error("Error stack:", err.stack)
    console.error("Full error:", err)
    
    // In production, redirect to home with generic error
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
    }
    
    // In development, return detailed error for debugging
    return new NextResponse(
      JSON.stringify({ 
        error: err.message, 
        name: err.name,
        stack: err.stack 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
