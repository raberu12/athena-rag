# Developer Guide

## Database Schema

### Tables

- **profiles**: User profiles linked to Supabase Auth
- **conversations**: Chat sessions per user
- **messages**: Chat messages with optional citations (JSONB)
- **documents**: PDF metadata (name, size, page count)
- **document_chunks**: Text chunks with vector embeddings

### Security

All tables have Row-Level Security (RLS) policies ensuring users can only access their own data. The `match_documents` function filters by `auth.uid()`.

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Ingest documentation into vector store
npm run ingest:docs

# Check for broken links in docs
npm run check:docs-links
```

## Known Limitations

1. **LLM Format Variability**: Occasionally the LLM may not return perfect JSON format, causing fallback to raw response without citations
2. **No Streaming**: Responses are returned in full, not streamed

## Environment Variables

Required environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Migrations

Run these SQL scripts in Supabase SQL Editor:

1. `supabase/schema.sql` - Main database schema
2. `supabase/add_match_function.sql` - Vector search function
3. `supabase/add_citations_column.sql` - Citation persistence
