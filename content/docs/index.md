# RAG Chatbot with Citations

A document-aware chatbot built with Next.js and Supabase that uses Retrieval-Augmented Generation (RAG) to answer questions based on uploaded documents. Features Wikipedia-style inline citations that link responses back to source documents.

## Features

- **Document Upload**: Upload and process PDF, Markdown, JSON, and plaintext files
- **Vector Search**: Uses pgvector for similarity-based document retrieval
- **Conversational Memory**: Persists chat history across sessions
- **Interactive Citations**: Inline citation markers with hover tooltips and click-to-expand modals
- **User Authentication**: Secure login with Supabase Auth
- **Row-Level Security**: Each user can only access their own documents and conversations

## Supported File Types

| Type | Extension | MIME Type |
|------|-----------|-----------|
| PDF | `.pdf` | `application/pdf` |
| Markdown | `.md` | `text/markdown` |
| JSON | `.json` | `application/json` |
| Plain Text | `.txt` | `text/plain` |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS 4 |
| UI Components | Radix UI, shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Vector Store | pgvector extension |
| LLM Provider | OpenRouter (Gemini 2.0 Flash) |
| Embeddings | OpenRouter text-embedding-3-small |
