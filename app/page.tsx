"use client"

import { useState } from "react"
import useSWR from "swr"
import { Github, AlertCircle } from "lucide-react"
import { GitHubSearchForm } from "@/components/github-search-form"
import { GitHubWorthResultCard } from "@/components/github-worth-result"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

  const { data, error, isLoading } = useSWR<GitHubWorthResult>(
    searchedUsername ? `/api/github-worth?username=${searchedUsername}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )

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
          <ThemeToggle />
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
              Find out your GitHub account value in Nigerian Naira based on your
              public activity. For entertainment purposes only!
            </p>
          </header>

          {!data && !isLoading && !error && (
            <div className="max-w-md mx-auto">
              <GitHubSearchForm onSearch={handleSearch} isLoading={isLoading} />
            </div>
          )}

          {isLoading && (
            <div className="max-w-md mx-auto">
              <GitHubSearchForm onSearch={handleSearch} isLoading={isLoading} />
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 text-muted-foreground animate-pulse">
                  <span>Analyzing {searchedUsername}&apos;s GitHub...</span>
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

          {data && !isLoading && (
            <div className="space-y-8">
              <GitHubWorthResultCard result={data} />
              <div className="text-center">
                <button
                  onClick={handleReset}
                  className="text-primary hover:text-primary/80 font-medium text-sm underline-offset-4 hover:underline transition-colors"
                >
                  Check Another Username
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!data && !isLoading && (
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
