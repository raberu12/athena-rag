/**
 * Text Chunking Module
 */

import { RAG_CONFIG } from "./config";
import type { DocumentChunk, ChunkMetadata } from "./types";

/**
 * Split text into overlapping chunks with metadata
 */
export function chunkText(
    text: string,
    documentId: string,
    documentName: string,
    config = RAG_CONFIG
): DocumentChunk[] {
    const { chunkSize, chunkOverlap } = config;
    const chunks: DocumentChunk[] = [];

    // Normalize whitespace
    const normalizedText = text.replace(/\s+/g, " ").trim();

    if (normalizedText.length === 0) {
        return [];
    }

    let startChar = 0;
    let chunkIndex = 0;

    while (startChar < normalizedText.length) {
        // Calculate end position
        let endChar = Math.min(startChar + chunkSize, normalizedText.length);

        // Try to break at sentence or word boundary if not at end
        if (endChar < normalizedText.length) {
            // Look for sentence boundary within last 20% of chunk
            const lookbackStart = Math.max(startChar, endChar - Math.floor(chunkSize * 0.2));
            const lookbackText = normalizedText.slice(lookbackStart, endChar);

            const sentenceMatch = lookbackText.match(/[.!?]\s+[A-Z]/);
            if (sentenceMatch && sentenceMatch.index !== undefined) {
                endChar = lookbackStart + sentenceMatch.index + 2; // Include the period and space
            } else {
                // Fall back to word boundary
                const lastSpace = normalizedText.lastIndexOf(" ", endChar);
                if (lastSpace > startChar) {
                    endChar = lastSpace;
                }
            }
        }

        const content = normalizedText.slice(startChar, endChar).trim();

        if (content.length > 0) {
            const metadata: ChunkMetadata = {
                documentName,
                chunkIndex,
                startChar,
                endChar,
            };

            chunks.push({
                id: `${documentId}-chunk-${chunkIndex}`,
                documentId,
                content,
                metadata,
            });

            chunkIndex++;
        }

        // Move to next chunk with overlap
        startChar = endChar - chunkOverlap;

        // Prevent infinite loop
        if (startChar >= normalizedText.length - 1) break;
        if (endChar === normalizedText.length) break;
    }

    return chunks;
}
