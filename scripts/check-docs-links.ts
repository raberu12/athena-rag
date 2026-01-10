/**
 * Documentation Link Checker Script
 * 
 * Checks for broken internal links in markdown documentation files.
 * 
 * Usage:
 *   npx tsx scripts/check-docs-links.ts
 */

import fs from "fs";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "content/docs");

interface LinkInfo {
    file: string;
    line: number;
    text: string;
    href: string;
}

/**
 * Extract markdown links from content
 */
function extractLinks(content: string, filename: string): LinkInfo[] {
    const links: LinkInfo[] = [];
    const lines = content.split("\n");

    // Match [text](href) pattern
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    lines.forEach((line, lineIndex) => {
        let match;
        while ((match = linkRegex.exec(line)) !== null) {
            links.push({
                file: filename,
                line: lineIndex + 1,
                text: match[1],
                href: match[2],
            });
        }
    });

    return links;
}

/**
 * Check if an internal link is valid
 */
function isValidInternalLink(href: string, currentFile: string): { valid: boolean; reason?: string } {
    // Skip external links
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
        return { valid: true };
    }

    // Skip anchor-only links
    if (href.startsWith("#")) {
        return { valid: true };
    }

    // Handle relative links within docs
    let targetPath: string;

    if (href.startsWith("/docs/")) {
        // Absolute docs path
        const slug = href.replace("/docs/", "").replace(/\/$/, "") || "index";
        targetPath = path.join(DOCS_DIR, `${slug}.md`);
    } else if (href.startsWith("/")) {
        // Other absolute paths (app routes) - skip validation
        return { valid: true };
    } else {
        // Relative path
        const currentDir = path.dirname(path.join(DOCS_DIR, currentFile));
        targetPath = path.join(currentDir, href);

        // Add .md if no extension
        if (!path.extname(targetPath)) {
            targetPath += ".md";
        }
    }

    if (!fs.existsSync(targetPath)) {
        return { valid: false, reason: `File not found: ${targetPath}` };
    }

    return { valid: true };
}

async function main() {
    console.log("🔗 Documentation Link Checker");
    console.log("============================\n");

    // Read all docs files
    const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"));
    console.log(`📁 Checking ${files.length} files in ${DOCS_DIR}\n`);

    const allLinks: LinkInfo[] = [];
    const brokenLinks: (LinkInfo & { reason: string })[] = [];

    for (const filename of files) {
        const filePath = path.join(DOCS_DIR, filename);
        const content = fs.readFileSync(filePath, "utf-8");
        const links = extractLinks(content, filename);
        allLinks.push(...links);

        for (const link of links) {
            const result = isValidInternalLink(link.href, filename);
            if (!result.valid && result.reason) {
                brokenLinks.push({ ...link, reason: result.reason });
            }
        }
    }

    console.log(`📊 Found ${allLinks.length} total links\n`);

    if (brokenLinks.length === 0) {
        console.log("✅ All links are valid!\n");
        process.exit(0);
    } else {
        console.log(`❌ Found ${brokenLinks.length} broken links:\n`);

        for (const link of brokenLinks) {
            console.log(`  ${link.file}:${link.line}`);
            console.log(`    Link: [${link.text}](${link.href})`);
            console.log(`    Error: ${link.reason}\n`);
        }

        process.exit(1);
    }
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
