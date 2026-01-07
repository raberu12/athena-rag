/**
 * PDF Text Extraction
 */

import { FILE_CONSTRAINTS } from "./config";

// Dynamic import for pdf-parse (CommonJS module)
async function getPdfParse() {
    const pdfParse = await import("pdf-parse");
    return pdfParse.default;
}

export interface ParseResult {
    text: string;
    pageCount: number;
}

/**
 * Parse a PDF buffer and extract text content
 */
export async function parsePDF(buffer: Buffer, fileName: string): Promise<ParseResult> {
    // Validate file size
    const fileSizeMB = buffer.length / (1024 * 1024);
    if (fileSizeMB > FILE_CONSTRAINTS.maxFileSizeMB) {
        throw new Error(`File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed (${FILE_CONSTRAINTS.maxFileSizeMB}MB)`);
    }

    try {
        const pdfParse = await getPdfParse();
        const data = await pdfParse(buffer);

        if (!data.text || data.text.trim().length === 0) {
            throw new Error("No text content found in PDF. The file may be scanned or image-based.");
        }

        return {
            text: data.text,
            pageCount: data.numpages,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to parse PDF "${fileName}": ${error.message}`);
        }
        throw new Error(`Failed to parse PDF "${fileName}": Unknown error`);
    }
}

/**
 * Parse plain text content (for non-PDF files)
 */
export function parseText(content: string): ParseResult {
    return {
        text: content,
        pageCount: 1,
    };
}
