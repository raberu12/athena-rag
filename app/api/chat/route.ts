/**
 * Chat API - RAG-powered responses using OpenRouter
 * Uses Supabase auth and pgvector for document retrieval
 * Returns structured responses with inline citations
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildRAGPromptWithCitations, chatWithSystem, parseResponseWithFallback } from "@/lib/rag";
import { addMessage } from "@/lib/db/messages";
import { getConversation, updateConversation } from "@/lib/db/conversations";
import { searchSimilar, getChunkCount } from "@/lib/db/vector-store";
import { generateEmbedding } from "@/lib/rag/embeddings";
import { RAG_CONFIG } from "@/lib/rag/config";
import type { ChatRequest, ChatResponse } from "@/types/rag";

interface ExtendedChatRequest extends ChatRequest {
  conversationId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | { error: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as ExtendedChatRequest;
    const { query, documentIds, conversationId } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "No query provided" },
        { status: 400 }
      );
    }

    console.log(`[Chat API] Query: "${query.substring(0, 50)}..."`);

    // Persist user message if conversationId provided
    if (conversationId) {
      // Verify conversation ownership
      const conversation = await getConversation(conversationId);
      if (!conversation || conversation.user_id !== user.id) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      await addMessage(conversationId, "user", query);

      // Auto-generate title from first message if still "New Chat"
      if (conversation.title === "New Chat") {
        const title = query.length > 50 ? query.substring(0, 47) + "..." : query;
        await updateConversation(conversationId, { title });
      }
    }

    // Check if user has any documents in the database
    const totalChunks = await getChunkCount(user.id);
    const hasDocuments = totalChunks > 0;

    console.log(`[Chat API] User has ${totalChunks} chunks in database`);

    // Build context for RAG using database search
    let retrievalResult;

    if (hasDocuments) {
      try {
        console.log(`[Chat API] Querying database with documentIds:`, documentIds);
        const queryEmbedding = await generateEmbedding(query);
        console.log(`[Chat API] Generated query embedding, searching...`);

        const dbChunks = await searchSimilar(
          queryEmbedding,
          RAG_CONFIG.topK,
          RAG_CONFIG.scoreThreshold,
          documentIds,
          user.id
        );

        console.log(`[Chat API] Database returned ${dbChunks.length} chunks`);

        if (dbChunks.length > 0) {
          retrievalResult = {
            chunks: dbChunks.map((chunk) => ({
              chunk: {
                id: chunk.id,
                documentId: chunk.document_id,
                content: chunk.content,
                metadata: {
                  documentName: chunk.document_name || "Unknown",
                  chunkIndex: chunk.chunk_index,
                  startChar: chunk.start_char,
                  endChar: chunk.end_char,
                },
              },
              score: chunk.similarity,
            })),
            isEmpty: false,
          };
        } else {
          console.log(`[Chat API] No matching chunks found in database`);
          retrievalResult = { chunks: [], isEmpty: true };
        }
      } catch (dbError) {
        console.error("[Chat API] Database retrieval error:", dbError);
        retrievalResult = { chunks: [], isEmpty: true };
      }
    } else {
      retrievalResult = { chunks: [], isEmpty: true };
    }

    // Build RAG prompt with citation support
    const { system, user: userPrompt, citations, validCitationIds } =
      buildRAGPromptWithCitations(query, retrievalResult, hasDocuments);

    // Generate response using OpenRouter
    const rawResponse = await chatWithSystem(system, userPrompt);
    console.log(`[Chat API] Generated raw response (${rawResponse.length} chars)`);

    // Parse structured response and extract citations
    const { answer, citations: usedCitations } = parseResponseWithFallback(
      rawResponse,
      citations,
      validCitationIds
    );

    console.log(`[Chat API] Parsed response with ${usedCitations.length} citations`);

    // Persist assistant response with citations if conversationId provided
    if (conversationId) {
      await addMessage(conversationId, "assistant", answer, usedCitations);
    }

    return NextResponse.json({
      response: answer,
      citations: usedCitations,
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process request: ${message}` },
      { status: 500 }
    );
  }
}

