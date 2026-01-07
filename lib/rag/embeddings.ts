/**
 * Embeddings Client - OpenRouter Integration
 */

import { OPENROUTER_CONFIG } from "./config";

interface OpenRouterEmbeddingResponse {
    data: Array<{
        embedding: number[];
        index: number;
    }>;
    usage: {
        prompt_tokens: number;
        total_tokens: number;
    };
}

interface OpenRouterErrorResponse {
    error: {
        message: string;
        code: number;
    };
}

// Use a embedding model via OpenRouter
const EMBEDDING_MODEL = "openai/text-embedding-3-large";

// Maximum texts per batch (OpenRouter/OpenAI typically allow up to 2048)
const BATCH_SIZE = 100;

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await generateEmbeddings([text]);
    return embeddings[0];
}

/**
 * Generate embeddings for multiple texts (with automatic batching)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    if (texts.length === 0) {
        return [];
    }

    console.log(`[Embeddings] Generating embeddings for ${texts.length} texts`);

    // Process in batches
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

        console.log(`[Embeddings] Processing batch ${batchNum}/${totalBatches} (${batch.length} texts)`);

        const batchEmbeddings = await generateEmbeddingsBatch(batch, apiKey);
        allEmbeddings.push(...batchEmbeddings);

        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < texts.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`[Embeddings] Completed: ${allEmbeddings.length} embeddings generated`);
    return allEmbeddings;
}

/**
 * Generate embeddings for a single batch
 */
async function generateEmbeddingsBatch(texts: string[], apiKey: string): Promise<number[][]> {
    try {
        const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/embeddings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "RAG Chatbot",
            },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                input: texts,
            }),
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error(`[Embeddings] API error: ${responseText}`);
            throw new Error(`OpenRouter Embeddings API error (${response.status}): ${responseText}`);
        }

        let data: OpenRouterEmbeddingResponse;
        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error(`Failed to parse embedding response: ${responseText.substring(0, 200)}`);
        }

        if (!data.data || !Array.isArray(data.data)) {
            console.error(`[Embeddings] Unexpected response structure:`, data);
            throw new Error(`Unexpected embedding response structure`);
        }

        // Sort by index to maintain order
        const sortedData = data.data.sort((a, b) => a.index - b.index);
        return sortedData.map((item) => item.embedding);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to generate embeddings: ${error.message}`);
        }
        throw new Error("Failed to generate embeddings: Unknown error");
    }
}

/**
 * Generate embedding for a query (same as regular embedding for OpenRouter)
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
    return generateEmbedding(query);
}
