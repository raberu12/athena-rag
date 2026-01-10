# Architecture

## System Overview

```
                    +------------------+
                    |   User Query     |
                    +--------+---------+
                             |
                             v
+------------------+    +----+----+    +------------------+
|   PDF Upload     +--->| Next.js |<---+  Supabase Auth   |
+------------------+    |   API   |    +------------------+
                        +----+----+
                             |
          +------------------+------------------+
          |                  |                  |
          v                  v                  v
   +------+------+    +------+------+    +------+------+
   |   Chunker   |    |  Retriever  |    |  OpenRouter |
   | (pdf-parse) |    |  (pgvector) |    |   (LLM)     |
   +------+------+    +------+------+    +------+------+
          |                  |                  |
          v                  v                  v
   +------+------+    +------+------+    +------+------+
   |  Embeddings |    | Vector      |    | Response    |
   |  Generator  |    | Search      |    | Parser      |
   +-------------+    +-------------+    +-------------+
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/           # Chat endpoint with RAG pipeline
│   │   ├── conversations/  # Conversation CRUD
│   │   └── documents/      # Document upload and management
│   ├── auth/               # Login, signup, callback routes
│   ├── docs/               # Documentation pages
│   └── page.tsx            # Main chat interface
├── components/
│   ├── chat-panel.tsx      # Main chat component
│   ├── chat-message.tsx    # Message rendering with citations
│   ├── citation-marker.tsx # Inline [1] citation markers
│   ├── citation-modal.tsx  # Full citation content modal
│   └── docs/               # Documentation components
├── content/
│   └── docs/               # Markdown documentation files
├── lib/
│   ├── rag/
│   │   ├── chunker.ts      # PDF text chunking
│   │   ├── embeddings.ts   # Embedding generation
│   │   ├── retriever.ts    # Vector search and context formatting
│   │   ├── prompts.ts      # LLM prompt templates
│   │   ├── response-parser.ts  # JSON response parsing
│   │   └── openrouter.ts   # OpenRouter API client
│   ├── db/
│   │   ├── conversations.ts
│   │   ├── documents.ts
│   │   └── messages.ts
│   ├── citations/
│   │   └── parser.ts       # Frontend citation marker parser
│   └── supabase/           # Supabase client setup
├── scripts/
│   └── ingest-docs.ts      # Documentation ingestion script
├── supabase/
│   ├── schema.sql          # Database schema
│   └── add_citations_column.sql  # Citation persistence migration
└── types/
    ├── rag.ts              # RAG system types
    └── supabase.ts         # Database types
```
