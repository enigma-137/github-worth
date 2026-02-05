"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Github, AlertCircle, Lock, LogOut } from "lucide-react"
import { GitHubSearchForm } from "@/components/github-search-form"
import { GitHubWorthResultCard } from "@/components/github-worth-result"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ConsentModal } from "@/components/consent-modal"
import type { GitHubWorthResult } from "@/lib/github-scoring"

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Failed to fetch")
    }
    return res.json()
  })

export default function Home() {
  const [searchedUsername, setSearchedUsername] = useState<string | null>(null)

  // Fetch logged in user
  const { data: userData, error: userError, isLoading: userLoading } = useSWR<GitHubWorthResult>(
    "/api/user/me",
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false, // Don't revalidate too aggressively
    }
  )

  const { data: searchData, error: searchError, isLoading: searchLoading } = useSWR<GitHubWorthResult>(
    searchedUsername ? `/api/github-worth?username=${searchedUsername}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )

  // Use either search data or user data (if not searching)
  const displayData = searchedUsername ? searchData : userData
  const isLoading = searchedUsername ? searchLoading : userLoading
  const error = searchedUsername ? searchError : null // Don't show userError (401) as specific error, just means not logged in

  const handleSearch = (username: string) => {
    setSearchedUsername(username)
  }

  const handleReset = () => {
    setSearchedUsername(null)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">Naira Worth</span>
          </div>
          <div className="flex items-center gap-4">
            {userData && (
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{userData.username}</span>
                {userData.isPrivateMode && <Lock className="h-3 w-3" />}
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--primary)_0%,transparent_50%)] opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,var(--secondary)_0%,transparent_50%)] opacity-10" />

        <div className="relative container mx-auto px-4 py-12 md:py-20">
          <header className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-3 mb-6">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <Github className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 text-balance">
              How Much is Your{" "}
              <span className="text-primary">GitHub Hustle</span> Worth?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Find out your GitHub account value in Nigerian Naira.
              {userData ? " Welcome back!" : " Connect for deeper insights including private repos."}
            </p>

            {!userData && !isLoading && (
              <div className="mt-6 flex justify-center gap-4">
                <ConsentModal>
                  <Button variant="default" size="lg" className="rounded-full shadow-lg hover:shadow-primary/25 transition-all">
                    Connect Private Repos (Secret)
                  </Button>
                </ConsentModal>
              </div>
            )}

            {userData && !searchedUsername && (
              <div className="mt-6">
                <Button variant="outline" onClick={() => handleSearch("other")} size="sm">
                  Check Someone Else
                </Button>
              </div>
            )}
          </header>

          {!displayData && !isLoading && !error && (
            <div className="max-w-md mx-auto">
              <GitHubSearchForm onSearch={handleSearch} isLoading={isLoading} />
            </div>
          )}

          {isLoading && (
            <div className="max-w-md mx-auto">
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 text-muted-foreground animate-pulse">
                  <span>Calculating Worth...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-md mx-auto space-y-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
              <GitHubSearchForm onSearch={handleSearch} isLoading={isLoading} />
            </div>
          )}

          {displayData && !isLoading && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <GitHubWorthResultCard result={displayData} />

              <div className="text-center flex flex-col items-center gap-4">
                {searchedUsername ? (
                  <button
                    onClick={handleReset}
                    className="text-primary hover:text-primary/80 font-medium text-sm underline-offset-4 hover:underline transition-colors"
                  >
                    Back to My Score
                  </button>
                ) : (
                  !displayData.isPrivateMode && (
                    <div className="bg-muted/50 p-4 rounded-xl border border-dashed border-primary/50">
                      <p className="text-sm text-muted-foreground mb-3">
                        Missing out on your private contributions?
                        They are worth <strong>50%</strong> of public points!
                      </p>
                      <ConsentModal>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Lock className="h-3 w-3" />
                          Add Private Repos
                        </Button>
                      </ConsentModal>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!displayData && !isLoading && (
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
              How We Calculate Your Worth
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <FeatureCard
                step="01"
                title="Fetch Your Data"
                description="We pull your public GitHub profile, repositories, stars, followers, and activity data."
              />
              <FeatureCard
                step="02"
                title="Calculate Score"
                description="Our algorithm weighs factors like stars, active repos, account age, and language diversity."
              />
              <FeatureCard
                step="03"
                title="Convert to Naira"
                description="Your hustle score is converted to Nigerian Naira for a fun, shareable result."
              />
            </div>
          </div>
        </section>
      )}

      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Built for fun.{" "}
            <a
              href="https://x.com/nigmaQX"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Visit my Twitter
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({
  step,
  title,
  description,
}: {
  step: string
  title: string
  description: string
}) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      <div className="text-5xl font-bold text-primary/20 mb-4 font-mono">
        {step}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
