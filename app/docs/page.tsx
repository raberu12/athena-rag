import { DocShell } from "@/components/docs/DocShell"
import { MarkdownContent } from "@/components/docs/MarkdownContent"
import fs from "fs"
import path from "path"

export default async function DocsPage() {
    const filePath = path.join(process.cwd(), "content/docs/index.md")
    const content = fs.readFileSync(filePath, "utf-8")

    return (
        <DocShell currentSlug="">
            <MarkdownContent content={content} />
        </DocShell>
    )
}
