/**
 * Retrieval Module
 * Provides utilities for formatting retrieved chunks
 * 
 * Note: For retrieval, use searchSimilar from @/lib/db/vector-store
 */

import type { RetrievalResult } from "./types";
import type { CitationData } from "@/types/rag";

/**
 * Result of formatting context with citation support
 */
export interface CitationContext {
    contextString: string;      // formatted context for LLM prompt
    citations: CitationData[];  // citation data for response
}

/**
 * Generate a snippet from content (150-200 chars)
 */
function generateSnippet(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
        return content.trim();
    }

    // Find a natural break point (end of sentence or word)
    const truncated = content.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');

    const breakPoint = lastPeriod > maxLength * 0.6
        ? lastPeriod + 1
        : lastSpace > 0 ? lastSpace : maxLength;

    return content.substring(0, breakPoint).trim() + '...';
}

/**
 * Format retrieved chunks as context string for LLM prompts (legacy)
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

/**
 * Format retrieved chunks with citation IDs for structured LLM responses
 * Assigns stable IDs (c1, c2, ...) and generates snippets for tooltips
 */
export function formatContextWithCitations(result: RetrievalResult): CitationContext {
    if (result.isEmpty || result.chunks.length === 0) {
        return {
            contextString: "",
            citations: []
        };
    }

    const citations: CitationData[] = [];
    const contextParts: string[] = [];

    result.chunks.forEach((scored, index) => {
        const { chunk, score } = scored;
        const citationId = `c${index + 1}`;

        // Build citation data
        const citation: CitationData = {
            id: citationId,
            snippet: generateSnippet(chunk.content),
            content: chunk.content,
            metadata: {
                source: chunk.metadata.documentName,
                chunkIndex: chunk.metadata.chunkIndex,
            }
        };
        citations.push(citation);

        // Format context for LLM with citation ID
        contextParts.push(
            `[Citation ID: ${citationId}]\n` +
            `[Source: ${chunk.metadata.documentName}]\n` +
            `[Relevance: ${(score * 100).toFixed(0)}%]\n` +
            `Content:\n${chunk.content}`
        );
    });

    return {
        contextString: contextParts.join("\n\n---\n\n"),
        citations
    };
}

