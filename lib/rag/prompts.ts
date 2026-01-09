/**
 * Prompt Construction Module
 */

import type { RetrievalResult } from "./types";
import type { CitationData } from "@/types/rag";
import { formatContextForPrompt, formatContextWithCitations, type CitationContext } from "./retriever";

interface PromptPair {
    system: string;
    user: string;
}

/**
 * Extended prompt result that includes citation data
 */
export interface PromptWithCitations extends PromptPair {
    citations: CitationData[];
    validCitationIds: string[];
}

/**
 * Build prompts for RAG-grounded responses (legacy, no citations)
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

/**
 * Build prompts for RAG-grounded responses with inline citation support
 * Instructs the LLM to return structured JSON with {{cite:cX}} markers
 */
export function buildRAGPromptWithCitations(
    query: string,
    retrievalResult: RetrievalResult,
    hasDocuments: boolean
): PromptWithCitations {
    // No documents uploaded - return empty citations
    if (!hasDocuments) {
        return {
            system: `You are a helpful document assistant. Currently, no documents have been uploaded.

Your only task is to inform the user that they need to upload documents before you can answer questions about them.

You MUST respond with a JSON object in this exact format:
{
  "answer": "Your response text here",
  "citations": []
}

Be polite and helpful in your response.`,
            user: query,
            citations: [],
            validCitationIds: [],
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

You MUST respond with a JSON object in this exact format:
{
  "answer": "Your response text here",
  "citations": []
}

Be concise and helpful.`,
            user: query,
            citations: [],
            validCitationIds: [],
        };
    }

    // Format context with citation IDs
    const { contextString, citations }: CitationContext = formatContextWithCitations(retrievalResult);
    const validCitationIds = citations.map(c => c.id);

    return {
        system: `You are a helpful document assistant. Answer the user's question using ONLY the information from the provided context.

CRITICAL: YOUR ENTIRE RESPONSE MUST BE A SINGLE JSON OBJECT. DO NOT OUTPUT ANYTHING BEFORE OR AFTER THE JSON.

CITATION INSTRUCTIONS:
- Each source in the context has a Citation ID (${validCitationIds.join(', ')})
- You MUST add {{cite:cX}} markers inline with your answer text
- Place citation markers immediately after each claim from that source
- Example: "The event occurred in 1872{{cite:c1}} and involved soldiers{{cite:c2}}."

RESPONSE FORMAT - RETURN ONLY THIS JSON:
{
  "answer": "Your answer with {{cite:c1}} markers inline.",
  "citations": []
}

RULES:
1. Use ONLY information from the provided context
2. Add {{cite:cX}} after EVERY claim that comes from a source
3. Use plain text only, no markdown
4. The "citations" array should be empty - the system fills it

EXAMPLE RESPONSE:
{"answer": "The capital of France is Paris{{cite:c1}}. It has a population of 2 million{{cite:c1}}.", "citations": []}`,
        user: `Context from uploaded documents:

${contextString}

---

User question: ${query}`,
        citations,
        validCitationIds,
    };
}

