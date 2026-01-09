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

## Architecture

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
│   └── page.tsx            # Main chat interface
├── components/
│   ├── chat-panel.tsx      # Main chat component
│   ├── chat-message.tsx    # Message rendering with citations
│   ├── citation-marker.tsx # Inline [1] citation markers
│   └── citation-modal.tsx  # Full citation content modal
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
├── supabase/
│   ├── schema.sql          # Database schema
│   └── add_citations_column.sql  # Citation persistence migration
└── types/
    ├── rag.ts              # RAG system types
    └── supabase.ts         # Database types
```

## Setup

### Prerequisites

- Node.js 20+
- Supabase project (with pgvector extension enabled)
- OpenRouter API key

### Environment Variables

Create a `.env` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Enable the pgvector extension in Supabase:
   ```sql
   create extension vector;
   ```

2. Run the schema in Supabase SQL Editor:
   - `supabase/schema.sql` - Main database schema
   - `supabase/add_match_function.sql` - Vector search function
   - `supabase/add_citations_column.sql` - Citation persistence

### Installation

```bash
npm install
npm run dev
```

## RAG Pipeline

### Document Processing

1. **Upload**: PDF files are validated (max 10MB) and parsed using `pdf-parse`
2. **Chunking**: Text is split into 500-character chunks with 100-character overlap
3. **Embedding**: Each chunk is embedded using `text-embedding-3-small` (1536 dimensions)
4. **Storage**: Chunks and embeddings are stored in `document_chunks` table

### Query Processing

1. **Embed Query**: User query is converted to a vector embedding
2. **Vector Search**: Top 8 most similar chunks are retrieved (cosine similarity)
3. **Context Formatting**: Retrieved chunks are formatted with citation IDs (c1, c2, ...)
4. **LLM Generation**: Context and query are sent to Gemini 2.0 Flash
5. **Response Parsing**: JSON response is parsed and citation markers are extracted
6. **Persistence**: Message and citations are saved to database

### Citation System

The LLM is instructed to include inline citation markers `{{cite:c1}}` in its responses. These are:

- **Parsed** by the frontend into structured data
- **Rendered** as superscript `[1]`, `[2]` markers
- **Interactive**: Hover shows snippet tooltip, click opens full content modal
- **Persisted**: Citations are stored as JSONB in the messages table

## Configuration

RAG settings in `lib/rag/config.ts`:

| Setting | Default | Description |
|---------|---------|-------------|
| `chunkSize` | 500 | Characters per chunk |
| `chunkOverlap` | 100 | Overlap between chunks |
| `topK` | 8 | Number of chunks to retrieve |
| `scoreThreshold` | 0.1 | Minimum similarity score |

OpenRouter settings:
- Model: `google/gemini-2.0-flash-001`
- Temperature: 0.3

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send query, get RAG response with citations |
| GET | `/api/conversations` | List user conversations |
| POST | `/api/conversations` | Create new conversation |
| GET | `/api/conversations/[id]` | Get conversation with messages |
| DELETE | `/api/conversations/[id]` | Delete conversation |
| GET | `/api/documents` | List user documents |
| POST | `/api/documents` | Upload and process PDF |
| DELETE | `/api/documents/[id]` | Delete document and chunks |

## Database Schema

### Tables

- **profiles**: User profiles linked to Supabase Auth
- **conversations**: Chat sessions per user
- **messages**: Chat messages with optional citations (JSONB)
- **documents**: PDF metadata (name, size, page count)
- **document_chunks**: Text chunks with vector embeddings

### Security

All tables have Row-Level Security (RLS) policies ensuring users can only access their own data. The `match_documents` function filters by `auth.uid()`.

## Known Limitations

1. **LLM Format Variability**: Occasionally the LLM may not return perfect JSON format, causing fallback to raw response without citations
2. **No Streaming**: Responses are returned in full, not streamed

## Development

```bash
# Development server
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## License

Private
