/**
 * RAG Library - Main Entry Point
 */

// Types
export type {
    DocumentChunk,
    ChunkMetadata,
    RetrievalResult,
    ScoredChunk,
    ProcessedDocument,
    RAGConfig,
    ChatCompletionMessage,
} from "./types";

// Configuration
export { RAG_CONFIG, OPENROUTER_CONFIG, validateEnv } from "./config";

// Document Processing
export { parsePDF, parseText } from "./parser";
export { chunkText } from "./chunker";

// Embeddings
export { generateEmbedding, generateEmbeddings, generateQueryEmbedding } from "./embeddings";

// Retrieval (Note: use lib/db/vector-store for database-backed retrieval)
export { formatContextForPrompt, formatContextWithCitations } from "./retriever";
export type { CitationContext } from "./retriever";

// Prompt Construction
export { buildRAGPrompt, buildRAGPromptWithCitations } from "./prompts";
export type { PromptWithCitations } from "./prompts";

// Response Parsing
export { parseStructuredResponse, parseResponseWithFallback } from "./response-parser";
export type { ParsedResponse } from "./response-parser";

// OpenRouter Client
export { chat, chatWithSystem } from "./openrouter";

