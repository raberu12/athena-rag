/**
 * Chat API - RAG-powered responses using OpenRouter
 * Updated to use Supabase auth and persist messages
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  retrieveContext,
  buildRAGPrompt,
  chatWithSystem,
  vectorStore,
} from "@/lib/rag";
import { addMessage, getMessages } from "@/lib/db/messages";
import { getConversation, updateConversation } from "@/lib/db/conversations";
import { searchSimilar } from "@/lib/db/vector-store";
import { generateEmbedding } from "@/lib/rag/embeddings";
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

    // Check for documents - try both in-memory and database
    const inMemoryChunkCount = vectorStore.getChunkCount();
    let hasDocuments = inMemoryChunkCount > 0;

    console.log(`[Chat API] In-memory chunks: ${inMemoryChunkCount}`);

    // Build context for RAG
    let retrievalResult;

    if (hasDocuments) {
      // Use in-memory store for this session (already loaded)
      retrievalResult = await retrieveContext(query, documentIds);
      console.log(`[Chat API] Retrieved ${retrievalResult.chunks.length} chunks from memory`);
    } else {
      // Try database if in-memory is empty
      try {
        const queryEmbedding = await generateEmbedding(query);
        const dbChunks = await searchSimilar(queryEmbedding, 5, 0.7, documentIds);

        if (dbChunks.length > 0) {
          hasDocuments = true;
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
          console.log(`[Chat API] Retrieved ${dbChunks.length} chunks from database`);
        } else {
          retrievalResult = { chunks: [], isEmpty: true };
        }
      } catch (dbError) {
        console.error("[Chat API] Database retrieval error:", dbError);
        retrievalResult = { chunks: [], isEmpty: true };
      }
    }

    if (!retrievalResult) {
      retrievalResult = { chunks: [], isEmpty: true };
    }

    // Build RAG prompt
    const { system, user: userPrompt } = buildRAGPrompt(query, retrievalResult, hasDocuments);

    // Generate response using OpenRouter
    const response = await chatWithSystem(system, userPrompt);
    console.log(`[Chat API] Generated response (${response.length} chars)`);

    // Persist assistant response if conversationId provided
    if (conversationId) {
      await addMessage(conversationId, "assistant", response);
    }

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
