"use client"

import { useState } from "react"
import useSWR from "swr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, Trophy, Calendar, Medal, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type LeaderboardEntry = {
    username: string
    avatarUrl: string
    hustleScore: number
    mode: "PUBLIC" | "PRIVATE" | "GUEST"
    change?: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function LeaderboardSection() {
    const [activeTab, setActiveTab] = useState("lifetime")

    return (
        <section className="py-16 bg-muted/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-4">Top Hustlers</h2>
                    <p className="text-muted-foreground">See who's shipping the most</p>
                </div>

                <div className="max-w-3xl mx-auto">
                    <Tabs defaultValue="lifetime" onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8 h-auto">
                            <TabsTrigger value="lifetime" className="gap-1 sm:gap-2 py-3 px-1 sm:px-2">
                                <Trophy className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] xs:text-xs sm:text-sm">Lifetime</span>
                            </TabsTrigger>
                            <TabsTrigger value="weekly" className="gap-1 sm:gap-2 py-3 px-1 sm:px-2">
                                <TrendingUp className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] xs:text-xs sm:text-sm hidden sm:inline">Weekly Growth</span>
                                <span className="text-[10px] xs:text-xs sm:hidden">Weekly</span>
                            </TabsTrigger>
                            <TabsTrigger value="monthly" className="gap-1 sm:gap-2 py-3 px-1 sm:px-2">
                                <Calendar className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] xs:text-xs sm:text-sm hidden sm:inline">Monthly Growth</span>
                                <span className="text-[10px] xs:text-xs sm:hidden">Monthly</span>
                            </TabsTrigger>
                        </TabsList>

                        <LeaderboardList type="lifetime" active={activeTab === "lifetime"} />
                        <LeaderboardList type="weekly" active={activeTab === "weekly"} />
                        <LeaderboardList type="monthly" active={activeTab === "monthly"} />
                    </Tabs>
                </div>
            </div>
        </section>
    )
}

function LeaderboardList({ type, active }: { type: string, active: boolean }) {

    const { data, isLoading, error } = useSWR<LeaderboardEntry[]>(
        active ? `/api/leaderboard?type=${type}` : null,
        fetcher
    )

    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    const totalPages = data ? Math.ceil(data.length / ITEMS_PER_PAGE) : 0
    const paginatedData = data?.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    if (!active) return <TabsContent value={type} />

    return (
        <TabsContent value={type} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="p-8 text-center">
                    <div className="text-red-500 font-medium mb-2">Failed to load leaderboard</div>
                    <p className="text-muted-foreground text-sm">Please try again later</p>
                </div>
            ) : (
        <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {Array.isArray(paginatedData) && paginatedData.map((user, index) => {
                    const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                    return (
                        <div key={user.username} className={`flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${rank <= 3 ? 'bg-muted/30' : ''}`}>
                            <div className="flex items-center justify-center w-8">
                                {rank === 1 ? (
                                    <Trophy className="h-6 w-6 text-yellow-500" />
                                ) : rank === 2 ? (
                                    <Medal className="h-5 w-5 text-slate-400" />
                                ) : rank === 3 ? (
                                    <Medal className="h-5 w-5 text-amber-600" />
                                ) : (
                                    <span className="font-mono text-lg font-bold text-muted-foreground">
                                        {rank}
                                    </span>
                                )}
                            </div>
                            <Avatar className={`h-10 w-10 border-2 ${
                                rank === 1 ? 'border-yellow-500/50' : 
                                rank === 2 ? 'border-slate-400/50' : 
                                rank === 3 ? 'border-amber-600/50' : 'border-border'
                            }`}>
                                <AvatarImage src={user.avatarUrl} alt={user.username} />
                                <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate flex items-center gap-2">
                                    {user.username}
                                    {rank === 1 && <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">King</span>}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {user.mode === "PRIVATE" 
                                        ? "Verified Private" 
                                        : user.mode === "GUEST" 
                                            ? "Guest Search" 
                                            : "Public Profile"}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold text-lg ${rank <= 3 ? 'text-primary' : 'text-primary/80'}`}>
                                    {type === "lifetime" ? (
                                        `₦${(user.hustleScore * 2500).toLocaleString()}`
                                    ) : (
                                        `+${user.change?.toLocaleString()}`
                                    )}
                                </div>
                                {type !== "lifetime" && (
                                    <div className="text-xs text-green-500 font-medium">
                                        points
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
                {data?.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No data yet. Be the first!
                    </div>
                )}
            </div>

            {data && data.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-xs font-medium text-muted-foreground px-2">
                        Page {currentPage} of {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
            )}
        </TabsContent>
    )
}
