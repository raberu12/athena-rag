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
    graphql_public: {
        Tables: Record<string, never>;
        Views: Record<string, never>;
        Functions: {
            graphql: {
                Args: {
                    operationName?: string;
                    query?: string;
                    variables?: Json;
                    extensions?: Json;
                };
                Returns: Json;
            };
        };
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
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
                Relationships: [];
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
                Relationships: [
                    {
                        foreignKeyName: "conversations_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    }
                ];
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
                Relationships: [
                    {
                        foreignKeyName: "messages_conversation_id_fkey";
                        columns: ["conversation_id"];
                        isOneToOne: false;
                        referencedRelation: "conversations";
                        referencedColumns: ["id"];
                    }
                ];
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
                Relationships: [
                    {
                        foreignKeyName: "documents_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    }
                ];
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
                Relationships: [
                    {
                        foreignKeyName: "document_chunks_document_id_fkey";
                        columns: ["document_id"];
                        isOneToOne: false;
                        referencedRelation: "documents";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: Record<string, never>;
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
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"];
