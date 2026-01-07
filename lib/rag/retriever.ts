/**
 * Retrieval Module
 */

import { generateQueryEmbedding } from "./embeddings";
import { vectorStore } from "./vector-store";
import type { RetrievalResult } from "./types";
import { RAG_CONFIG } from "./config";

/**
 * Retrieve relevant context for a query
 */
export async function retrieveContext(
    query: string,
    documentIds?: string[],
    topK: number = RAG_CONFIG.topK
): Promise<RetrievalResult> {
    // Check if there are any documents in the store
    const chunkCount = vectorStore.getChunkCount();
    const storedDocIds = vectorStore.getDocumentIds();

    console.log(`[Retriever] Chunk count: ${chunkCount}, Document IDs in store: ${JSON.stringify(storedDocIds)}`);
    console.log(`[Retriever] Requested document IDs: ${JSON.stringify(documentIds)}`);

    if (chunkCount === 0) {
        console.log(`[Retriever] No chunks in store, returning empty`);
        return {
            chunks: [],
            isEmpty: true,
        };
    }

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);
    console.log(`[Retriever] Generated query embedding (${queryEmbedding.length} dimensions)`);

    // Search vector store
    const result = vectorStore.search(queryEmbedding, topK, RAG_CONFIG.scoreThreshold, documentIds);

    console.log(`[Retriever] Search results: ${result.chunks.length} chunks found`);
    if (result.chunks.length > 0) {
        console.log(`[Retriever] Top scores: ${result.chunks.map(c => c.score.toFixed(3)).join(', ')}`);
    }

    return result;
}

/**
 * Format retrieved chunks as context string
 */
export function formatContextForPrompt(result: RetrievalResult): string {
    if (result.isEmpty || result.chunks.length === 0) {
        return "";
    }

    const contextParts = result.chunks.map((scored, index) => {
        const { chunk, score } = scored;
        return `[Source ${index + 1}: ${chunk.metadata.documentName}, relevance: ${(score * 100).toFixed(0)}%]\n${chunk.content}`;
    });

    return contextParts.join("\n\n---\n\n");
}
