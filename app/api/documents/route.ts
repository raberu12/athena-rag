/**
 * Document Upload and Processing API
 */

import { NextRequest, NextResponse } from "next/server";
import {
    parsePDF,
    parseText,
    chunkText,
    generateEmbeddings,
    vectorStore,
    type ProcessedDocument,
    type DocumentChunk,
} from "@/lib/rag";

interface UploadResponse {
    success: boolean;
    document?: ProcessedDocument;
    error?: string;
}

interface DeleteResponse {
    success: boolean;
    error?: string;
}

/**
 * POST /api/documents - Upload and process a document
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const documentId = formData.get("documentId") as string | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        if (!documentId) {
            return NextResponse.json(
                { success: false, error: "No documentId provided" },
                { status: 400 }
            );
        }

        const fileName = file.name;
        const fileType = file.type;

        console.log(`[Documents API] Processing file: ${fileName} (${fileType})`);

        // Extract text based on file type
        let text: string;

        if (fileType === "application/pdf") {
            const buffer = Buffer.from(await file.arrayBuffer());
            const result = await parsePDF(buffer, fileName);
            text = result.text;
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

        // Attach embeddings to chunks
        const chunksWithEmbeddings: DocumentChunk[] = chunks.map((chunk, i) => ({
            ...chunk,
            embedding: embeddings[i],
        }));

        // Remove existing document if re-uploading
        if (vectorStore.hasDocument(documentId)) {
            vectorStore.removeDocument(documentId);
        }

        // Store in vector store
        vectorStore.addChunks(chunksWithEmbeddings);
        console.log(`[Documents API] Stored ${chunksWithEmbeddings.length} chunks in vector store`);

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
 * DELETE /api/documents - Remove a document from the vector store
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteResponse>> {
    try {
        const { documentId } = await request.json();

        if (!documentId) {
            return NextResponse.json(
                { success: false, error: "No documentId provided" },
                { status: 400 }
            );
        }

        const removed = vectorStore.removeDocument(documentId);

        if (!removed) {
            return NextResponse.json(
                { success: false, error: "Document not found" },
                { status: 404 }
            );
        }

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
