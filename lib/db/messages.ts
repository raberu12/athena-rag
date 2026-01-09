/**
 * Message Database Operations
 */

import { createClient } from "@/lib/supabase/server";
import type { Tables, InsertTables, UpdateTables, Json } from "@/types/supabase";
import type { CitationData } from "@/types/rag";

export type Message = Tables<"messages">;

/**
 * Get all messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[DB] Error fetching messages:", error);
        throw error;
    }

    return data || [];
}

/**
 * Add a message to a conversation
 * @param conversationId - The conversation to add the message to
 * @param role - "user" or "assistant"
 * @param content - The message content
 * @param citations - Optional citation data for assistant messages
 */
export async function addMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    citations?: CitationData[]
): Promise<Message> {
    const supabase = await createClient();

    const insertData: InsertTables<"messages"> = {
        conversation_id: conversationId,
        role,
        content,
        citations: citations ? (citations as unknown as Json) : null,
    };

    const { data, error } = await supabase
        .from("messages")
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error("[DB] Error adding message:", error);
        throw error;
    }

    // Update conversation's updated_at timestamp
    const updateData: UpdateTables<"conversations"> = { updated_at: new Date().toISOString() };
    await supabase
        .from("conversations")
        .update(updateData)
        .eq("id", conversationId);

    return data;
}

/**
 * Delete a specific message
 */
export async function deleteMessage(messageId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

    if (error) {
        console.error("[DB] Error deleting message:", error);
        throw error;
    }
}
