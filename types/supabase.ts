/**
 * Supabase Database Types
 * These types match the database schema defined in the implementation plan
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    display_name: string | null;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    display_name?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    display_name?: string | null;
                    created_at?: string;
                };
            };
            conversations: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            messages: {
                Row: {
                    id: string;
                    conversation_id: string;
                    role: "user" | "assistant";
                    content: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    conversation_id: string;
                    role: "user" | "assistant";
                    content: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    conversation_id?: string;
                    role?: "user" | "assistant";
                    content?: string;
                    created_at?: string;
                };
            };
            documents: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    size_bytes: number;
                    page_count: number | null;
                    storage_path: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    size_bytes: number;
                    page_count?: number | null;
                    storage_path?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    name?: string;
                    size_bytes?: number;
                    page_count?: number | null;
                    storage_path?: string | null;
                    created_at?: string;
                };
            };
            document_chunks: {
                Row: {
                    id: string;
                    document_id: string;
                    content: string;
                    chunk_index: number;
                    start_char: number;
                    end_char: number;
                    embedding: number[] | null;
                };
                Insert: {
                    id?: string;
                    document_id: string;
                    content: string;
                    chunk_index: number;
                    start_char: number;
                    end_char: number;
                    embedding?: number[] | null;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    content?: string;
                    chunk_index?: number;
                    start_char?: number;
                    end_char?: number;
                    embedding?: number[] | null;
                };
            };
        };
        Views: {};
        Functions: {
            match_documents: {
                Args: {
                    query_embedding: number[];
                    match_threshold: number;
                    match_count: number;
                    filter_document_ids?: string[];
                };
                Returns: {
                    id: string;
                    document_id: string;
                    content: string;
                    chunk_index: number;
                    start_char: number;
                    end_char: number;
                    similarity: number;
                }[];
            };
        };
        Enums: {};
    };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"];
