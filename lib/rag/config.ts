/**
 * RAG Pipeline Configuration
 */

import type { RAGConfig } from "./types";

// Validate required environment variables
export function validateEnv(): void {
    const required = ["OPENROUTER_API_KEY"];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
}

// Default configuration
export const RAG_CONFIG: RAGConfig = {
    chunkSize: 500,
    chunkOverlap: 100,
    topK: 8,
    scoreThreshold: 0.1,  // Lowered to allow more matches
};

// OpenRouter settings
export const OPENROUTER_CONFIG = {
    baseUrl: "https://openrouter.ai/api/v1",
    model: "google/gemini-2.0-flash-001",
};

// File constraints
export const FILE_CONSTRAINTS = {
    maxFileSizeMB: 10,
    supportedTypes: ["application/pdf"],
};
