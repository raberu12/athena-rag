/**
 * Document Upload and Processing API
 * Updated to use Supabase auth and persistent storage
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
    parsePDF,
    parseText,
    chunkText,
    generateEmbeddings,
    vectorStore,
    type ProcessedDocument,
    type DocumentChunk,
} from "@/lib/rag";
import {
    getDocuments,
    createDocument,
    deleteDocument as deleteDocumentFromDB,
} from "@/lib/db/documents";
import {
    addChunks,
    removeDocumentChunks,
    hasDocumentChunks,
} from "@/lib/db/vector-store";

interface UploadResponse {
    success: boolean;
    document?: ProcessedDocument;
    error?: string;
}

interface DeleteResponse {
    success: boolean;
    error?: string;
}

interface ListResponse {
    documents: Array<{
        id: string;
        name: string;
        size_bytes: number;
        page_count: number | null;
        created_at: string;
    }>;
}

/**
 * GET /api/documents - List user's documents
 */
export async function GET(): Promise<NextResponse<ListResponse | { error: string }>> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const documents = await getDocuments(user.id);
        return NextResponse.json({ documents });
    } catch (error) {
        console.error("[Documents API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch documents" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/documents - Upload and process a document
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        // Always generate document ID server-side (ignore any client-provided ID)

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        const fileName = file.name;
        const fileType = file.type;
        const fileSize = file.size;

        console.log(`[Documents API] Processing file: ${fileName} (${fileType})`);

        // Extract text based on file type
        let text: string;
        let pageCount: number | undefined;

        if (fileType === "application/pdf") {
            const buffer = Buffer.from(await file.arrayBuffer());
            const result = await parsePDF(buffer, fileName);
            text = result.text;
            pageCount = result.pageCount;
            console.log(`[Documents API] Extracted ${text.length} chars from PDF (${result.pageCount} pages)`);
        } else if (
            fileType === "text/plain" ||
            fileType === "text/markdown" ||
            fileType === "application/json" ||
            fileName.endsWith(".txt") ||
            fileName.endsWith(".md") ||
            fileName.endsWith(".json")
        ) {
            text = await file.text();
            console.log(`[Documents API] Read ${text.length} chars from text file`);
        } else {
            return NextResponse.json(
                { success: false, error: `Unsupported file type: ${fileType}` },
                { status: 400 }
            );
        }

        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: "No text content found in file" },
                { status: 400 }
            );
        }

        // Always create document record in database (generates UUID)
        const doc = await createDocument(user.id, {
            name: fileName,
            size_bytes: fileSize,
            page_count: pageCount,
        });
        const documentId = doc.id;

        // Chunk the text
        const chunks = chunkText(text, documentId, fileName);
        console.log(`[Documents API] Created ${chunks.length} chunks`);

        if (chunks.length === 0) {
            return NextResponse.json(
                { success: false, error: "No chunks created from document" },
                { status: 400 }
            );
        }

        // Generate embeddings for all chunks
        const chunkTexts = chunks.map((c) => c.content);
        const embeddings = await generateEmbeddings(chunkTexts);
        console.log(`[Documents API] Generated ${embeddings.length} embeddings`);

        // Prepare chunks with embeddings for database storage
        const chunksWithEmbeddings = chunks.map((chunk, i) => ({
            content: chunk.content,
            chunk_index: chunk.metadata.chunkIndex,
            start_char: chunk.metadata.startChar,
            end_char: chunk.metadata.endChar,
            embedding: embeddings[i],
        }));

        // Remove existing chunks if re-uploading
        if (await hasDocumentChunks(documentId)) {
            await removeDocumentChunks(documentId);
        }

        // Store chunks in pgvector
        await addChunks(documentId, chunksWithEmbeddings);
        console.log(`[Documents API] Stored ${chunksWithEmbeddings.length} chunks in database`);

        // Also add to in-memory store for current session compatibility
        const inMemoryChunks: DocumentChunk[] = chunks.map((chunk, i) => ({
            ...chunk,
            embedding: embeddings[i],
        }));
        if (vectorStore.hasDocument(documentId)) {
            vectorStore.removeDocument(documentId);
        }
        vectorStore.addChunks(inMemoryChunks);

        const processedDocument: ProcessedDocument = {
            id: documentId,
            name: fileName,
            chunkCount: chunks.length,
            processedAt: new Date(),
        };

        return NextResponse.json({
            success: true,
            document: processedDocument,
        });
    } catch (error) {
        console.error("[Documents API] Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/documents - Remove a document from database and vector store
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteResponse>> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { documentId } = await request.json();

        if (!documentId) {
            return NextResponse.json(
                { success: false, error: "No documentId provided" },
                { status: 400 }
            );
        }

        // Delete from database (cascades to chunks)
        await deleteDocumentFromDB(documentId);

        // Also remove from in-memory store
        vectorStore.removeDocument(documentId);

        console.log(`[Documents API] Removed document: ${documentId}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Documents API] Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
