/**
 * Chat API - RAG-powered responses using OpenRouter
 */

import { NextRequest, NextResponse } from "next/server";
import {
  retrieveContext,
  buildRAGPrompt,
  chatWithSystem,
  vectorStore,
} from "@/lib/rag";
import type { ChatRequest, ChatResponse } from "@/types/rag";

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | { error: string }>> {
  try {
    const body = await request.json() as ChatRequest;
    const { query, documentIds } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "No query provided" },
        { status: 400 }
      );
    }

    console.log(`[Chat API] Query: "${query.substring(0, 50)}..."`);

    // Check if there are any documents
    const hasDocuments = vectorStore.getChunkCount() > 0;
    console.log(`[Chat API] Has documents: ${hasDocuments}, chunk count: ${vectorStore.getChunkCount()}`);

    // Retrieve relevant context
    let retrievalResult;
    if (hasDocuments) {
      retrievalResult = await retrieveContext(query, documentIds);
      console.log(`[Chat API] Retrieved ${retrievalResult.chunks.length} chunks`);
    } else {
      retrievalResult = { chunks: [], isEmpty: true };
    }

    // Build RAG prompt
    const { system, user } = buildRAGPrompt(query, retrievalResult, hasDocuments);

    // Generate response using OpenRouter
    const response = await chatWithSystem(system, user);
    console.log(`[Chat API] Generated response (${response.length} chars)`);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process request: ${message}` },
      { status: 500 }
    );
  }
}
