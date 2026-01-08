/**
 * Retrieval Module
 * Provides utilities for formatting retrieved chunks
 * 
 * Note: For retrieval, use searchSimilar from @/lib/db/vector-store
 */

import type { RetrievalResult } from "./types";

/**
 * Format retrieved chunks as context string for LLM prompts
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
