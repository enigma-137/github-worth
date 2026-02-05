"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Eye, CheckCircle2, XCircle } from "lucide-react"
import { useState } from "react"

export function ConsentModal({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)

    const handleConnect = () => {
        window.location.href = "/api/auth/login?private=true"
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Connect Private Repositories
                    </DialogTitle>
                    <DialogDescription>
                        Include your private work in your hustle score.
                        We prioritize your privacy above all else.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-4 border rounded-lg p-4 bg-muted/50">
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                What we access:
                            </h4>
                            <ul className="text-sm text-muted-foreground list-disc pl-6 space-y-1">
                                <li>Repository counts (Public & Private)</li>
                                <li>Contribution counts (Commits, PRs)</li>
                                <li>Activity timestamps</li>
                                <li>Language usage statistics</li>
                            </ul>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-border">
                            <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                                What we NEVER access:
                            </h4>
                            <ul className="text-sm text-muted-foreground list-disc pl-6 space-y-1">
                                <li>Your source code</li>
                                <li>File contents</li>
                                <li>Issue/PR details or comments</li>
                                <li>Organization secrets</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-500/10 text-blue-500 rounded-md text-sm">
                        <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>
                            Your access token is encrypted with AES-256 before storage.
                            You can revoke access at any time via GitHub.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleConnect} className="gap-2">
                        <Eye className="h-4 w-4" />
                        I Understand, Connect
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
