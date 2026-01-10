import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Documentation - Athena",
    description: "Athena RAG Chatbot documentation and developer guide",
}

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    )
}
