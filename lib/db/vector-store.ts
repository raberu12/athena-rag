/**
 * Vector Store Database Operations (pgvector)
 * Replaces the in-memory vector store with PostgreSQL + pgvector
 */

import { createClient } from "@/lib/supabase/server";
import type { InsertTables } from "@/types/supabase";
import { RAG_CONFIG } from "@/lib/rag/config";

export interface ChunkWithEmbedding {
    content: string;
    chunk_index: number;
    start_char: number;
    end_char: number;
    embedding: number[];
}

export interface ScoredChunk {
    id: string;
    document_id: string;
    content: string;
    chunk_index: number;
    start_char: number;
    end_char: number;
    similarity: number;
    document_name?: string;
}

/**
 * Add chunks with embeddings to the database
 */
export async function addChunks(
    documentId: string,
    chunks: ChunkWithEmbedding[]
): Promise<void> {
    const supabase = await createClient();

    const records = chunks.map((chunk) => ({
        document_id: documentId,
        content: chunk.content,
        chunk_index: chunk.chunk_index,
        start_char: chunk.start_char,
        end_char: chunk.end_char,
        embedding: chunk.embedding,
    })) as InsertTables<"document_chunks">[];

    // Insert in batches to avoid payload size limits
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from("document_chunks").insert(batch);

        if (error) {
            console.error("[VectorStore] Error adding chunks:", error);
            throw error;
        }
    }

    console.log(`[VectorStore] Added ${chunks.length} chunks for document ${documentId}`);
}

/**
 * Remove all chunks for a document
 */
export async function removeDocumentChunks(documentId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("document_chunks")
        .delete()
        .eq("document_id", documentId);

    if (error) {
        console.error("[VectorStore] Error removing chunks:", error);
        throw error;
    }
}

/**
 * Search for similar chunks using cosine similarity
 */
export async function searchSimilar(
    queryEmbedding: number[],
    topK: number = RAG_CONFIG.topK,
    threshold: number = RAG_CONFIG.scoreThreshold,
    documentIds?: string[]
): Promise<ScoredChunk[]> {
    const supabase = await createClient();

    // Use the match_documents RPC function for vector similarity search
    const { data, error } = await supabase.rpc("match_documents", {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: topK,
        filter_document_ids: documentIds || null,
    });

    if (error) {
        console.error("[VectorStore] Error searching similar chunks:", error);
        throw error;
    }

    return (data || []) as ScoredChunk[];
}

/**
 * Get chunk count for a user's documents
 */
export async function getChunkCount(userId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await supabase
        .from("document_chunks")
        .select("id", { count: "exact", head: true })
        .in(
            "document_id",
            supabase
                .from("documents")
                .select("id")
                .eq("user_id", userId)
        );

    if (error) {
        console.error("[VectorStore] Error getting chunk count:", error);
        return 0;
    }

    return count || 0;
}

/**
 * Check if a document has chunks in the store
 */
export async function hasDocumentChunks(documentId: string): Promise<boolean> {
    const supabase = await createClient();

    const { count, error } = await supabase
        .from("document_chunks")
        .select("id", { count: "exact", head: true })
        .eq("document_id", documentId);

    if (error) {
        console.error("[VectorStore] Error checking document chunks:", error);
        return false;
    }

    return (count || 0) > 0;
}
