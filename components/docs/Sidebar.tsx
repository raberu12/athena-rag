"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Cpu, Cog, Terminal, FileCode } from "lucide-react"

interface NavItem {
    title: string
    href: string
    icon: React.ReactNode
}

const navItems: NavItem[] = [
    {
        title: "Overview",
        href: "/docs",
        icon: <BookOpen className="h-4 w-4" />,
    },
    {
        title: "Architecture",
        href: "/docs/architecture",
        icon: <Cpu className="h-4 w-4" />,
    },
    {
        title: "RAG Design",
        href: "/docs/rag-design",
        icon: <Cog className="h-4 w-4" />,
    },
    {
        title: "API Reference",
        href: "/docs/api",
        icon: <FileCode className="h-4 w-4" />,
    },
    {
        title: "Developer Guide",
        href: "/docs/dev-guide",
        icon: <Terminal className="h-4 w-4" />,
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed left-0 top-0 z-30 h-screen w-64 border-r border-border bg-card">
            <div className="flex h-14 items-center border-b border-border px-4">
                <Link href="/" className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
                    <span className="font-[Aldrich] text-lg">Athena</span>
                    <span className="text-muted-foreground text-sm">Docs</span>
                </Link>
            </div>
            <ScrollArea className="h-[calc(100vh-3.5rem)]">
                <nav className="space-y-1 p-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                {item.icon}
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>
                <div className="border-t border-border p-4 mt-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Back to App
                    </Link>
                </div>
            </ScrollArea>
        </aside>
    )
}
