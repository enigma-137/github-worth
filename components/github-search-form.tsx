"use client"

import React from "react"

import { useState } from "react"
import { Search, Github, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface GitHubSearchFormProps {
  onSearch: (username: string) => void
  isLoading: boolean
}

export function GitHubSearchForm({ onSearch, isLoading }: GitHubSearchFormProps) {
  const [username, setUsername] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      onSearch(username.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Github className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter GitHub username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-14 pl-12 pr-4 text-lg bg-card border-2 border-border focus:border-primary rounded-xl shadow-sm"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={!username.trim() || isLoading}
          className="h-14 text-lg font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Calculating Worth...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Check My Worth
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
