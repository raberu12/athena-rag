import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownContentProps {
    content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
    return (
        <article className="prose-docs">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headings
                    h1: ({ children }) => (
                        <h1 className="text-3xl font-bold text-foreground mt-0 mb-6 font-[Aldrich]">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4 pb-2 border-b border-border">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">
                            {children}
                        </h3>
                    ),
                    // Paragraphs
                    p: ({ children }) => (
                        <p className="text-foreground/90 leading-7 mb-4">
                            {children}
                        </p>
                    ),
                    // Lists
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-2 mb-4 text-foreground/90">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground/90">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-7">{children}</li>
                    ),
                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                        >
                            {children}
                        </a>
                    ),
                    // Code - check if inside a pre block by looking at node structure
                    code: ({ node, className, children, ...props }) => {
                        // If code has a className (language-xxx) or parent is pre, it's a code block
                        const isCodeBlock = className || (node?.position && String(children).includes('\n'))

                        if (!isCodeBlock) {
                            // Inline code
                            return (
                                <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-foreground" style={{ fontFamily: '"Fira Code", monospace' }}>
                                    {children}
                                </code>
                            )
                        }
                        // Code block - let pre handle the styling
                        return (
                            <code className="block whitespace-pre" style={{ fontFamily: '"Fira Code", monospace' }} {...props}>
                                {children}
                            </code>
                        )
                    },
                    pre: ({ children }) => (
                        <pre className="bg-[#0d1117] text-[#c9d1d9] rounded-lg p-4 overflow-x-auto mb-4 text-sm border border-border" style={{ fontFamily: '"Fira Code", monospace' }}>
                            {children}
                        </pre>
                    ),
                    // Tables
                    table: ({ children }) => (
                        <div className="overflow-x-auto mb-4">
                            <table className="w-full border-collapse text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-muted/50">{children}</thead>
                    ),
                    th: ({ children }) => (
                        <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-border px-4 py-2 text-foreground/90">
                            {children}
                        </td>
                    ),
                    // Blockquotes
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                            {children}
                        </blockquote>
                    ),
                    // Horizontal rule
                    hr: () => <hr className="border-border my-8" />,
                    // Strong/Bold
                    strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </article>
    )
}

