/**
 * In-Memory Vector Store with Cosine Similarity Search
 */

import type { DocumentChunk, ScoredChunk, RetrievalResult } from "./types";
import { RAG_CONFIG } from "./config";

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

    if (magnitude === 0) {
        return 0;
    }

    return dotProduct / magnitude;
}

/**
 * In-memory vector store singleton
 */
class VectorStore {
    private chunks: Map<string, DocumentChunk> = new Map();
    private documentChunks: Map<string, Set<string>> = new Map();

    /**
     * Add chunks to the store
     */
    addChunks(chunks: DocumentChunk[]): void {
        for (const chunk of chunks) {
            if (!chunk.embedding) {
                throw new Error(`Chunk ${chunk.id} is missing embedding`);
            }

            this.chunks.set(chunk.id, chunk);

            // Track chunks by document
            if (!this.documentChunks.has(chunk.documentId)) {
                this.documentChunks.set(chunk.documentId, new Set());
            }
            this.documentChunks.get(chunk.documentId)!.add(chunk.id);
        }
    }

    /**
     * Remove all chunks belonging to a document
     */
    removeDocument(documentId: string): boolean {
        const chunkIds = this.documentChunks.get(documentId);

        if (!chunkIds) {
            return false;
        }

        for (const chunkId of chunkIds) {
            this.chunks.delete(chunkId);
        }

        this.documentChunks.delete(documentId);
        return true;
    }

    /**
     * Search for similar chunks using cosine similarity
     */
    search(
        queryEmbedding: number[],
        topK: number = RAG_CONFIG.topK,
        scoreThreshold: number = RAG_CONFIG.scoreThreshold,
        documentIds?: string[]
    ): RetrievalResult {
        const scores: ScoredChunk[] = [];

        for (const chunk of this.chunks.values()) {
            // Filter by document IDs if specified
            if (documentIds && !documentIds.includes(chunk.documentId)) {
                continue;
            }

            if (!chunk.embedding) {
                continue;
            }

            const score = cosineSimilarity(queryEmbedding, chunk.embedding);

            if (score >= scoreThreshold) {
                scores.push({ chunk, score });
            }
        }

        // Sort by score descending and take top K
        scores.sort((a, b) => b.score - a.score);
        const topChunks = scores.slice(0, topK);

        return {
            chunks: topChunks,
            isEmpty: topChunks.length === 0,
        };
    }

    /**
     * Get total number of chunks in store
     */
    getChunkCount(): number {
        return this.chunks.size;
    }

    /**
     * Get document IDs in store
     */
    getDocumentIds(): string[] {
        return Array.from(this.documentChunks.keys());
    }

    /**
     * Check if a document exists in store
     */
    hasDocument(documentId: string): boolean {
        return this.documentChunks.has(documentId);
    }

    /**
     * Clear all data from store
     */
    clear(): void {
        this.chunks.clear();
        this.documentChunks.clear();
    }
}

// Export singleton instance
export const vectorStore = new VectorStore();
