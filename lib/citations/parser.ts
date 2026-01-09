/**
 * Citation Parser
 * Parses {{cite:cX}} markers from answer strings into structured parts
 */

/**
 * Represents a part of the parsed answer
 */
export type ContentPart =
    | { type: 'text'; content: string }
    | { type: 'citation'; id: string };

/**
 * Normalize malformed citation formats
 * Converts {{cite:c3, c5}} to {{cite:c3}}{{cite:c5}}
 */
function normalizeCitationMarkers(answer: string): string {
    // Match {{cite:c1, c2, c3}} patterns and expand them
    return answer.replace(/\{\{cite:(c\d+(?:\s*,\s*c\d+)+)\}\}/g, (match, idList) => {
        // Split by comma and create separate citation markers
        const ids = idList.split(/\s*,\s*/);
        return ids.map((id: string) => `{{cite:${id.trim()}}}`).join('');
    });
}

/**
 * Parse answer text and extract citation markers
 * 
 * @param answer - The answer string containing {{cite:cX}} markers
 * @returns Array of content parts (text and citations)
 * 
 * @example
 * parseAnswerWithCitations("The capital is Paris{{cite:c1}}.")
 * // Returns: [
 * //   { type: 'text', content: 'The capital is Paris' },
 * //   { type: 'citation', id: 'c1' },
 * //   { type: 'text', content: '.' }
 * // ]
 */
export function parseAnswerWithCitations(answer: string): ContentPart[] {
    // First normalize any malformed citation formats
    const normalizedAnswer = normalizeCitationMarkers(answer);

    const parts: ContentPart[] = [];
    const regex = /\{\{cite:(c\d+)\}\}/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(normalizedAnswer)) !== null) {
        // Add text before the citation marker
        if (match.index > lastIndex) {
            const textContent = normalizedAnswer.substring(lastIndex, match.index);
            if (textContent) {
                parts.push({ type: 'text', content: textContent });
            }
        }

        // Add the citation marker
        parts.push({ type: 'citation', id: match[1] });

        lastIndex = regex.lastIndex;
    }

    // Add any remaining text after the last citation
    if (lastIndex < normalizedAnswer.length) {
        const textContent = normalizedAnswer.substring(lastIndex);
        if (textContent) {
            parts.push({ type: 'text', content: textContent });
        }
    }

    // If no citations found, return the whole answer as text
    if (parts.length === 0 && normalizedAnswer.length > 0) {
        parts.push({ type: 'text', content: normalizedAnswer });
    }

    return parts;
}

/**
 * Check if an answer contains any citation markers
 */
export function hasCitations(answer: string): boolean {
    return /\{\{cite:c\d+\}\}/.test(answer);
}

/**
 * Extract all unique citation IDs from an answer
 */
export function extractCitationIds(answer: string): string[] {
    const matches = answer.matchAll(/\{\{cite:(c\d+)\}\}/g);
    const ids = new Set<string>();
    for (const match of matches) {
        ids.add(match[1]);
    }
    return Array.from(ids);
}
