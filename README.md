# RAG Chatbot with Citations

A document-aware chatbot built with Next.js and Supabase that uses Retrieval-Augmented Generation (RAG) to answer questions based on uploaded documents.

> **Full Documentation**: See the [documentation site](/docs) for architecture, RAG design, API reference, and developer guide.

## Quick Start

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

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Check for broken links in docs
npm run check:docs-links
```

## License

Private

