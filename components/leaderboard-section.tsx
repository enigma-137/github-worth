"use client"

import { useState } from "react"
import useSWR from "swr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, Trophy, Calendar } from "lucide-react"

type LeaderboardEntry = {
    username: string
    avatarUrl: string
    hustleScore: number
    mode: "PUBLIC" | "PRIVATE"
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
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    {Array.isArray(data) && data.map((user, index) => (
                        <div key={user.username} className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                            <div className="font-mono text-xl font-bold text-muted-foreground w-8 text-center">
                                {index + 1}
                            </div>
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={user.avatarUrl} alt={user.username} />
                                <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{user.username}</div>
                                <div className="text-xs text-muted-foreground">
                                    {user.mode === "PRIVATE" ? "Verified Private" : "Public Profile"}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-lg text-primary">
                                    {type === "lifetime" ? (
                                        `₦${(user.hustleScore * 2500).toLocaleString()}` // Approx display
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
                    ))}
                    {data?.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            No data yet. Be the first!
                        </div>
                    )}
                </div>
            )}
        </TabsContent>
    )
}
