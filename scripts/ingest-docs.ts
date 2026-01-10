/**
 * Documentation Ingestion Script
 * 
 * Ingests markdown files from content/docs/ into the vector store
 * for RAG retrieval. Uses service role key for system-level access.
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/ingest-docs.ts
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Configuration
const DOCS_DIR = path.join(process.cwd(), "content/docs");
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000"; // System docs user
const DOCS_DOCUMENT_NAME = "project-documentation";

// Validate environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Error: Missing required environment variables");
    console.error("  NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "set" : "missing");
    console.error("  SUPABASE_SERVICE_ROLE_KEY:", serviceRoleKey ? "set" : "missing");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Read all markdown files from docs directory
 */
function readDocsFiles(): { name: string; content: string }[] {
    const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"));

    return files.map((filename) => {
        const filePath = path.join(DOCS_DIR, filename);
        const content = fs.readFileSync(filePath, "utf-8");
        return { name: filename, content };
    });
}

/**
 * Split text into overlapping chunks
 */
function chunkText(text: string): string[] {
    const normalizedText = text.replace(/\s+/g, " ").trim();
    const chunks: string[] = [];

    let startChar = 0;

    while (startChar < normalizedText.length) {
        let endChar = Math.min(startChar + CHUNK_SIZE, normalizedText.length);

        // Try to break at sentence boundary
        if (endChar < normalizedText.length) {
            const lastPeriod = normalizedText.lastIndexOf(". ", endChar);
            if (lastPeriod > startChar) {
                endChar = lastPeriod + 2;
            }
        }

        const chunk = normalizedText.slice(startChar, endChar).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        startChar = endChar - CHUNK_OVERLAP;
        if (startChar >= normalizedText.length - 1) break;
        if (endChar === normalizedText.length) break;
    }

    return chunks;
}

/**
 * Generate embeddings via OpenRouter
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!openrouterKey) {
        throw new Error("OPENROUTER_API_KEY is required for embeddings");
    }

    const embeddings: number[][] = [];

    // Process in batches of 20
    for (let i = 0; i < texts.length; i += 20) {
        const batch = texts.slice(i, i + 20);

        const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openrouterKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "openai/text-embedding-3-small",
                input: batch,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Embeddings API error: ${error}`);
        }

        const data = await response.json();
        embeddings.push(...data.data.map((d: { embedding: number[] }) => d.embedding));
    }

    return embeddings;
}

/**
 * Format embedding for pgvector
 */
function formatEmbedding(embedding: number[]): string {
    return `[${embedding.join(",")}]`;
}

async function main() {
    console.log("📚 Documentation Ingestion Script");
    console.log("================================\n");

    // Read docs files
    console.log(`📁 Reading docs from: ${DOCS_DIR}`);
    const docsFiles = readDocsFiles();
    console.log(`   Found ${docsFiles.length} markdown files\n`);

    // Combine all content with file markers
    const allContent = docsFiles
        .map((f) => `--- ${f.name} ---\n${f.content}`)
        .join("\n\n");

    // Chunk the combined content
    const chunks = chunkText(allContent);
    console.log(`📄 Created ${chunks.length} chunks\n`);

    // Check for existing docs document
    console.log("🔍 Checking for existing docs document...");
    const { data: existingDoc } = await supabase
        .from("documents")
        .select("id")
        .eq("name", DOCS_DOCUMENT_NAME)
        .single();

    let documentId: string;

    if (existingDoc) {
        documentId = existingDoc.id;
        console.log(`   Found existing document: ${documentId}`);

        // Remove old chunks
        console.log("   Removing old chunks...");
        const { error: deleteError } = await supabase
            .from("document_chunks")
            .delete()
            .eq("document_id", documentId);

        if (deleteError) {
            console.error("   Error deleting chunks:", deleteError);
            process.exit(1);
        }
    } else {
        // Create new document record
        console.log("   Creating new docs document record...");

        // First ensure system user exists in profiles (may need to be done manually)
        const { data: newDoc, error: createError } = await supabase
            .from("documents")
            .insert({
                user_id: SYSTEM_USER_ID,
                name: DOCS_DOCUMENT_NAME,
                size_bytes: Buffer.byteLength(allContent, "utf-8"),
                page_count: docsFiles.length,
            })
            .select()
            .single();

        if (createError) {
            console.error("   Error creating document:", createError);
            console.error("\n   Note: You may need to create a system user profile first:");
            console.error(`   INSERT INTO profiles (id, email) VALUES ('${SYSTEM_USER_ID}', 'system@docs');`);
            process.exit(1);
        }

        documentId = newDoc.id;
        console.log(`   Created document: ${documentId}`);
    }

    // Generate embeddings
    console.log("\n🧠 Generating embeddings...");
    const embeddings = await generateEmbeddings(chunks);
    console.log(`   Generated ${embeddings.length} embeddings\n`);

    // Prepare chunk records
    const chunkRecords = chunks.map((content, i) => ({
        document_id: documentId,
        content,
        chunk_index: i,
        start_char: 0, // Not tracking precisely for docs
        end_char: content.length,
        embedding: formatEmbedding(embeddings[i]),
    }));

    // Insert chunks in batches
    console.log("💾 Inserting chunks into database...");
    const batchSize = 50;

    for (let i = 0; i < chunkRecords.length; i += batchSize) {
        const batch = chunkRecords.slice(i, i + batchSize);

        const { error: insertError } = await supabase
            .from("document_chunks")
            .insert(batch);

        if (insertError) {
            console.error(`   Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError);
            process.exit(1);
        }

        console.log(`   Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunkRecords.length / batchSize)}`);
    }

    console.log("\n✅ Documentation ingested successfully!");
    console.log(`   Document ID: ${documentId}`);
    console.log(`   Total chunks: ${chunks.length}`);
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
