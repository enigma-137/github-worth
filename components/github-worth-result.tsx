"use client"

import React from "react"

import { useState } from "react"
import Image from "next/image"
import {
  Star,
  GitFork,
  Users,
  Code,
  Calendar,
  ExternalLink,
  Share2,
  Check,
  Zap,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatNaira, type GitHubWorthResult } from "@/lib/github-scoring"

interface GitHubWorthResultProps {
  result: GitHubWorthResult
}

export function GitHubWorthResultCard({ result }: GitHubWorthResultProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareText = `My GitHub is worth ${formatNaira(result.nairaValue)}! ${result.affordabilityTier.emoji} ${result.affordabilityTier.label}\n\nCheck yours at:`
    const shareUrl = typeof window !== "undefined" ? window.location.origin : ""

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My GitHub Naira Worth",
          text: shareText,
          url: shareUrl,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const accountYears = Math.floor(result.stats.accountAgeDays / 365)
  const accountMonths = Math.floor((result.stats.accountAgeDays % 365) / 30)

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Worth Card */}
      <Card className="overflow-hidden border-2 border-primary/20 shadow-xl bg-card">
        <CardContent className="p-0">
          {/* Header with Avatar */}
          <div className="bg-primary/10 p-6 flex items-center gap-4">
            <div className="relative">
              <Image
                src={result.avatarUrl || "/placeholder.svg"}
                alt={result.username}
                width={80}
                height={80}
                className="rounded-full border-4 border-card shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 bg-secondary text-secondary-foreground rounded-full p-1.5">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-card-foreground truncate">
                @{result.username}
              </h2>
              {result.name && (
                <p className="text-muted-foreground truncate">{result.name}</p>
              )}
              <a
                href={result.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mt-1"
              >
                View Profile <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Worth Display */}
          <div className="p-6 text-center border-b border-border">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Your GitHub is Worth
            </p>
            <p className="text-5xl md:text-6xl font-bold text-primary mb-2 font-mono">
              {formatNaira(result.nairaValue)}
            </p>
            <Badge
              variant="secondary"
              className="text-base px-4 py-1.5 font-medium"
            >
              {result.affordabilityTier.emoji} {result.affordabilityTier.label}
            </Badge>
            <p className="text-muted-foreground mt-3 text-sm max-w-sm mx-auto">
              {result.affordabilityTier.description}
            </p>
          </div>

          {/* Hustle Score */}
          <div className="p-6 bg-muted/30 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Hustle Score
              </span>
              <span className="text-2xl font-bold text-foreground font-mono">
                {result.hustleScore.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((result.hustleScore / 5000) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Max score: 5,000
            </p>
          </div>

          {/* Message */}
          <div className="p-6 bg-secondary/10 border-b border-border">
            <p className="text-center text-lg font-medium text-foreground italic">
              {`"${result.message}"`}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Your GitHub Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem
                icon={<Users className="h-4 w-4" />}
                label="Followers"
                value={result.stats.followers}
              />
              <StatItem
                icon={<Star className="h-4 w-4" />}
                label="Total Stars"
                value={result.stats.totalStars}
              />
              <StatItem
                icon={<GitFork className="h-4 w-4" />}
                label="Total Forks"
                value={result.stats.totalForks}
              />
              <StatItem
                icon={<Code className="h-4 w-4" />}
                label="Public Repos"
                value={result.stats.publicRepos}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <StatItem
                icon={<Zap className="h-4 w-4" />}
                label="Active Repos"
                value={result.stats.activeRepos}
              />
              <StatItem
                icon={<Code className="h-4 w-4" />}
                label="Original Repos"
                value={result.stats.originalRepos}
              />
              <StatItem
                icon={<Calendar className="h-4 w-4" />}
                label="Account Age"
                value={
                  accountYears > 0
                    ? `${accountYears}y ${accountMonths}m`
                    : `${accountMonths}m`
                }
              />
            </div>

            {/* Languages */}
            {result.stats.languages.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Languages Used
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.stats.languages.slice(0, 8).map((lang) => (
                    <Badge key={lang} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                  {result.stats.languages.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{result.stats.languages.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Share Button */}
          <div className="p-6 bg-muted/30 border-t border-border">
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full h-12 text-base font-medium bg-transparent"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-5 w-5" />
                  Share Your Worth
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Score Breakdown
          </h3>
          <div className="space-y-3">
            <BreakdownItem label="Followers" value={result.breakdown.followers} />
            <BreakdownItem label="Stars" value={result.breakdown.stars} />
            <BreakdownItem label="Active Repos" value={result.breakdown.activeRepos} />
            <BreakdownItem label="Original Repos" value={result.breakdown.originalRepos} />
            <BreakdownItem label="Account Age" value={result.breakdown.accountAge} />
            <BreakdownItem label="Language Diversity" value={result.breakdown.languageDiversity} />
            {result.breakdown.bonuses > 0 && (
              <BreakdownItem
                label="Bonuses"
                value={result.breakdown.bonuses}
                isPositive
              />
            )}
            {result.breakdown.penalties > 0 && (
              <BreakdownItem
                label="Penalties"
                value={-result.breakdown.penalties}
                isNegative
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground px-4">
        This estimate is based on public GitHub activity and is for fun only.
        Not a real financial valuation.
      </p>
    </div>
  )
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  )
}

function BreakdownItem({
  label,
  value,
  isPositive,
  isNegative,
}: {
  label: string
  value: number
  isPositive?: boolean
  isNegative?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-mono font-medium ${
          isPositive
            ? "text-secondary"
            : isNegative
              ? "text-destructive"
              : "text-foreground"
        }`}
      >
        {isPositive && "+"}
        {value.toLocaleString()}
      </span>
    </div>
  )
}
