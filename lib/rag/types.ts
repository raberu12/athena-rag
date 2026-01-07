/**
 * RAG Pipeline Types
 */

export interface DocumentChunk {
    id: string;
    documentId: string;
    content: string;
    metadata: ChunkMetadata;
    embedding?: number[];
}

export interface ChunkMetadata {
    documentName: string;
    chunkIndex: number;
    startChar: number;
    endChar: number;
}

export interface RetrievalResult {
    chunks: ScoredChunk[];
    isEmpty: boolean;
}

export interface ScoredChunk {
    chunk: DocumentChunk;
    score: number;
}

export interface ProcessedDocument {
    id: string;
    name: string;
    chunkCount: number;
    processedAt: Date;
}

export interface RAGConfig {
    chunkSize: number;
    chunkOverlap: number;
    topK: number;
    scoreThreshold: number;
}

export interface ChatCompletionMessage {
    role: "system" | "user" | "assistant";
    content: string;
}
