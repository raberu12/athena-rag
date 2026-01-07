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

// Vector Store
export { vectorStore } from "./vector-store";

// Retrieval
export { retrieveContext, formatContextForPrompt } from "./retriever";

// Prompt Construction
export { buildRAGPrompt } from "./prompts";

// OpenRouter Client
export { chat, chatWithSystem } from "./openrouter";
