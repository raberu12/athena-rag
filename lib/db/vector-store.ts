/**
 * Vector Store Database Operations (pgvector)
 * Replaces the in-memory vector store with PostgreSQL + pgvector
 */

import { createClient } from "@/lib/supabase/server";
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

interface ChunkRecord {
    document_id: string;
    content: string;
    chunk_index: number;
    start_char: number;
    end_char: number;
    embedding: number[];
}

/**
 * Add chunks with embeddings to the database
 */
export async function addChunks(
    documentId: string,
    chunks: ChunkWithEmbedding[]
): Promise<void> {
    const supabase = await createClient();

    const records: ChunkRecord[] = chunks.map((chunk) => ({
        document_id: documentId,
        content: chunk.content,
        chunk_index: chunk.chunk_index,
        start_char: chunk.start_char,
        end_char: chunk.end_char,
        embedding: chunk.embedding,
    }));

    // Insert in batches to avoid payload size limits
    const batchSize = 100;
    console.log(`[VectorStore] Adding ${chunks.length} chunks for document ${documentId}`);

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        console.log(`[VectorStore] Inserting batch ${Math.floor(i / batchSize) + 1}, size: ${batch.length}`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from("document_chunks") as any).insert(batch).select();

        if (error) {
            console.error("[VectorStore] Error adding chunks:", error);
            throw error;
        }

        console.log(`[VectorStore] Inserted ${data?.length || 0} records`);
    }

    console.log(`[VectorStore] Successfully added ${chunks.length} chunks for document ${documentId}`);
}

/**
 * Remove all chunks for a document
 */
export async function removeDocumentChunks(documentId: string): Promise<void> {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("document_chunks") as any)
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
    documentIds?: string[],
    userId?: string
): Promise<ScoredChunk[]> {
    const supabase = await createClient();

    console.log(`[VectorStore] Searching with topK=${topK}, threshold=${threshold}, userId=${userId}, docIds:`, documentIds);

    // Use the match_documents RPC function for vector similarity search
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("match_documents", {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: topK,
        filter_document_ids: documentIds || null,
        p_user_id: userId || null,
    });

    if (error) {
        console.error("[VectorStore] Error searching similar chunks:", error);
        throw error;
    }

    console.log(`[VectorStore] RPC returned ${data?.length || 0} results`);
    return (data || []) as ScoredChunk[];
}

/**
 * Get chunk count for a user's documents (using separate queries)
 */
export async function getChunkCount(userId: string): Promise<number> {
    const supabase = await createClient();

    // First get the user's document IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: docs, error: docsError } = await (supabase.from("documents") as any)
        .select("id")
        .eq("user_id", userId);

    if (docsError || !docs || docs.length === 0) {
        return 0;
    }

    const docIds = docs.map((d: { id: string }) => d.id);

    // Then count chunks for those documents
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase.from("document_chunks") as any)
        .select("id", { count: "exact", head: true })
        .in("document_id", docIds);

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase.from("document_chunks") as any)
        .select("id", { count: "exact", head: true })
        .eq("document_id", documentId);

    if (error) {
        console.error("[VectorStore] Error checking document chunks:", error);
        return false;
    }

    return (count || 0) > 0;
}
