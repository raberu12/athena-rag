/**
 * Conversation Database Operations
 */

import { createClient } from "@/lib/supabase/server";
import type { Tables, InsertTables, UpdateTables } from "@/types/supabase";

export type Conversation = Tables<"conversations">;

/**
 * Get all conversations for a user
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("[DB] Error fetching conversations:", error);
        throw error;
    }

    return data || [];
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return null; // Not found
        }
        console.error("[DB] Error fetching conversation:", error);
        throw error;
    }

    return data;
}

/**
 * Create a new conversation
 */
export async function createConversation(
    userId: string,
    title: string = "New Chat"
): Promise<Conversation> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title } as InsertTables<"conversations">)
        .select()
        .single();

    if (error) {
        console.error("[DB] Error creating conversation:", error);
        throw error;
    }

    return data;
}

/**
 * Update a conversation's title
 */
export async function updateConversation(
    conversationId: string,
    updates: UpdateTables<"conversations">
): Promise<Conversation> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("conversations")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", conversationId)
        .select()
        .single();

    if (error) {
        console.error("[DB] Error updating conversation:", error);
        throw error;
    }

    return data;
}

/**
 * Delete a conversation (cascades to messages)
 */
export async function deleteConversation(conversationId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

    if (error) {
        console.error("[DB] Error deleting conversation:", error);
        throw error;
    }
}
