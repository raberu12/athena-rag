/**
 * Document Database Operations
 */

import { createClient } from "@/lib/supabase/server";
import type { Tables, InsertTables } from "@/types/supabase";

export type Document = Tables<"documents">;

/**
 * Get all documents for a user
 */
export async function getDocuments(userId: string): Promise<Document[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[DB] Error fetching documents:", error);
        throw error;
    }

    return data || [];
}

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string): Promise<Document | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return null;
        }
        console.error("[DB] Error fetching document:", error);
        throw error;
    }

    return data;
}

/**
 * Create a new document record
 */
export async function createDocument(
    userId: string,
    metadata: {
        name: string;
        size_bytes: number;
        page_count?: number;
        storage_path?: string;
    }
): Promise<Document> {
    const supabase = await createClient();

    const insertData: InsertTables<"documents"> = {
        user_id: userId,
        name: metadata.name,
        size_bytes: metadata.size_bytes,
        page_count: metadata.page_count,
        storage_path: metadata.storage_path,
    };

    const { data, error } = await supabase
        .from("documents")
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error("[DB] Error creating document:", error);
        throw error;
    }

    return data;
}

/**
 * Delete a document and its chunks (cascades)
 */
export async function deleteDocument(documentId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

    if (error) {
        console.error("[DB] Error deleting document:", error);
        throw error;
    }
}
