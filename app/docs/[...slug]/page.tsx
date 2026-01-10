import { DocShell } from "@/components/docs/DocShell"
import { MarkdownContent } from "@/components/docs/MarkdownContent"
import { notFound } from "next/navigation"
import fs from "fs"
import path from "path"

interface DocsPageProps {
    params: Promise<{
        slug: string[]
    }>
}

// Generate static params for all docs pages
export async function generateStaticParams() {
    const docsDir = path.join(process.cwd(), "content/docs")
    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md") && f !== "index.md")

    return files.map((file) => ({
        slug: [file.replace(".md", "")],
    }))
}

export async function generateMetadata({ params }: DocsPageProps) {
    const { slug } = await params
    const slugPath = slug.join("/")

    // Map slug to human-readable title
    const titles: Record<string, string> = {
        architecture: "Architecture",
        "rag-design": "RAG Design",
        api: "API Reference",
        "dev-guide": "Developer Guide",
    }

    const title = titles[slugPath] || slugPath

    return {
        title: `${title} - Athena Docs`,
        description: `Athena documentation: ${title}`,
    }
}

export default async function DocsSlugPage({ params }: DocsPageProps) {
    const { slug } = await params
    const slugPath = slug.join("/")
    const filePath = path.join(process.cwd(), `content/docs/${slugPath}.md`)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        notFound()
    }

    const content = fs.readFileSync(filePath, "utf-8")

    return (
        <DocShell currentSlug={slugPath}>
            <MarkdownContent content={content} />
        </DocShell>
    )
}
