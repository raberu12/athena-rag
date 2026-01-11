/**
 * Response Parser Module
 * Parses and validates structured JSON responses from LLM
 */

import type { CitationData } from "@/types/rag";

export interface ParsedResponse {
    answer: string;
    citations: CitationData[];
    isValid: boolean;
    error?: string;
}

/**
 * Extract JSON from a response that might be wrapped in markdown code blocks
 * or preceded by plain text
 */
function extractJSON(rawResponse: string): string {
    // Try to extract JSON from markdown code blocks first
    const jsonBlockMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
        return jsonBlockMatch[1].trim();
    }

    // Try to find a JSON object that looks like our expected format
    // Look for {"answer": pattern specifically
    const answerJsonMatch = rawResponse.match(/\{\s*"answer"\s*:\s*"[\s\S]*?"\s*,\s*"citations"\s*:\s*\[[\s\S]*?\]\s*\}/);
    if (answerJsonMatch) {
        return answerJsonMatch[0];
    }

    // Try to find any JSON object containing "answer" key
    // Use a greedy but balanced approach - find the last complete JSON object
    const jsonObjects = rawResponse.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
    if (jsonObjects) {
        // Find the one that contains "answer"
        for (const obj of jsonObjects) {
            if (obj.includes('"answer"')) {
                return obj;
            }
        }
        // Otherwise return the last one
        return jsonObjects[jsonObjects.length - 1];
    }

    // Fallback: try to find any JSON-like structure
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return jsonMatch[0];
    }

    return rawResponse.trim();
}

/**
 * Remove invalid citation markers from the answer
 */
function sanitizeCitationMarkers(
    answer: string,
    validCitationIds: string[]
): string {
    // Match all {{cite:cX}} patterns
    return answer.replace(/\{\{cite:(c\d+)\}\}/g, (match, citationId) => {
        if (validCitationIds.includes(citationId)) {
            return match; // Keep valid citations
        }
        return ''; // Remove invalid citations
    });
}

/**
 * Extract unique citation IDs used in the answer
 */
function extractUsedCitationIds(answer: string): string[] {
    const matches = answer.matchAll(/\{\{cite:(c\d+)\}\}/g);
    const ids = new Set<string>();
    for (const match of matches) {
        ids.add(match[1]);
    }
    return Array.from(ids);
}

/**
 * Parse and validate structured LLM response
 * 
 * @param rawResponse - Raw string response from LLM
 * @param contextCitations - Citation data from retrieval context
 * @param validCitationIds - List of valid citation IDs (c1, c2, ...)
 * @returns Parsed and validated response
 */
export function parseStructuredResponse(
    rawResponse: string,
    contextCitations: CitationData[],
    validCitationIds: string[]
): ParsedResponse {
    try {
        // Extract JSON from response
        const jsonString = extractJSON(rawResponse);

        // Parse JSON
        const parsed = JSON.parse(jsonString);

        // Validate structure
        if (typeof parsed.answer !== 'string') {
            throw new Error('Missing or invalid "answer" field in response');
        }

        // Sanitize citation markers - remove any that aren't in our valid list
        const sanitizedAnswer = sanitizeCitationMarkers(parsed.answer, validCitationIds);

        // Get the citation IDs actually used in the answer
        const usedCitationIds = extractUsedCitationIds(sanitizedAnswer);

        // Filter context citations to only include those actually used
        const usedCitations = contextCitations.filter(c =>
            usedCitationIds.includes(c.id)
        );

        return {
            answer: sanitizedAnswer,
            citations: usedCitations,
            isValid: true,
        };
    } catch (error) {
        // Fallback: treat the entire response as plain text answer
        // BUT still try to extract citations if the response contains {{cite:cX}} markers
        console.warn('[Response Parser] Failed to parse JSON response, attempting plain text fallback');

        // Check if the raw response contains citation markers
        const usedCitationIds = extractUsedCitationIds(rawResponse);

        if (usedCitationIds.length > 0) {
            // Sanitize and extract citations from plain text response
            const sanitizedAnswer = sanitizeCitationMarkers(rawResponse, validCitationIds);
            const finalCitationIds = extractUsedCitationIds(sanitizedAnswer);
            const usedCitations = contextCitations.filter(c =>
                finalCitationIds.includes(c.id)
            );

            console.log(`[Response Parser] Extracted ${usedCitations.length} citations from plain text response`);

            return {
                answer: sanitizedAnswer,
                citations: usedCitations,
                isValid: false, // Still mark as invalid since JSON parsing failed
                error: 'JSON parsing failed but citations extracted from plain text',
            };
        }

        return {
            answer: rawResponse,
            citations: [],
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown parsing error',
        };
    }
}

/**
 * Parse response with graceful degradation
 * Always returns a usable answer, even if JSON parsing fails
 */
export function parseResponseWithFallback(
    rawResponse: string,
    contextCitations: CitationData[],
    validCitationIds: string[]
): { answer: string; citations: CitationData[] } {
    const result = parseStructuredResponse(rawResponse, contextCitations, validCitationIds);
    return {
        answer: result.answer,
        citations: result.citations,
    };
}
