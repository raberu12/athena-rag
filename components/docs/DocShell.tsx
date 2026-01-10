import type React from "react"
import { Sidebar } from "./Sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DocShellProps {
    children: React.ReactNode
    currentSlug: string
}

// Map slugs to breadcrumb titles
const slugTitles: Record<string, string> = {
    "": "Overview",
    architecture: "Architecture",
    "rag-design": "RAG Design",
    api: "API Reference",
    "dev-guide": "Developer Guide",
}

export function DocShell({ children, currentSlug }: DocShellProps) {
    const title = slugTitles[currentSlug] || currentSlug

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="ml-64 flex-1">
                <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur px-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
                            </BreadcrumbItem>
                            {currentSlug && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{title}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <ScrollArea className="h-[calc(100vh-3.5rem)]">
                    <div className="max-w-3xl mx-auto px-6 py-8">
                        {children}
                    </div>
                </ScrollArea>
            </main>
        </div>
    )
}
