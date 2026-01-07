/**
 * Prompt Construction Module
 */

import type { RetrievalResult } from "./types";
import { formatContextForPrompt } from "./retriever";

interface PromptPair {
    system: string;
    user: string;
}

/**
 * Build prompts for RAG-grounded responses
 */
export function buildRAGPrompt(
    query: string,
    retrievalResult: RetrievalResult,
    hasDocuments: boolean
): PromptPair {
    // No documents uploaded
    if (!hasDocuments) {
        return {
            system: `You are a helpful document assistant. Currently, no documents have been uploaded.

Your only task is to inform the user that they need to upload documents before you can answer questions about them.

Be polite and helpful in your response.`,
            user: query,
        };
    }

    // Documents uploaded but retrieval found no relevant content
    if (retrievalResult.isEmpty || retrievalResult.chunks.length === 0) {
        return {
            system: `You are a helpful document assistant. The user has uploaded documents, but no relevant information was found for their query.

IMPORTANT RULES:
1. Do NOT make up or invent any information
2. Do NOT answer based on general knowledge
3. Politely inform the user that their question could not be answered based on the uploaded documents
4. Suggest they try rephrasing their question or check if the relevant document was uploaded

Be concise and helpful.`,
            user: query,
        };
    }

    // Documents uploaded and relevant content found
    const context = formatContextForPrompt(retrievalResult);

    return {
        system: `You are a helpful document assistant. Answer the user's question using ONLY the information from the provided context.

IMPORTANT RULES:
1. Use ONLY information from the provided context - extract specific names, values, and details
2. Be specific and detailed - include actual names, numbers, and descriptions from the documents
3. If asked to list things, provide the actual names/items found in the context
4. If the context doesn't contain enough information to fully answer, say so
5. Do NOT make up or invent information beyond what's in the context
6. Do NOT cite source numbers (no "[Source 1]" references)
7. FORMATTING: Use plain text only. NO asterisks (*), NO bullet points, NO markdown. For lists, use numbered lists (1. 2. 3.) or separate items with commas.
8. Be helpful and informative, not vague or generic`,
        user: `Context from uploaded documents:

${context}

---

User question: ${query}`,
    };
}
