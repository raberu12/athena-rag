# RAG Pipeline Design

## Document Processing

1. **Upload**: PDF files are validated (max 10MB) and parsed using `pdf-parse`
2. **Chunking**: Text is split into 500-character chunks with 100-character overlap
3. **Embedding**: Each chunk is embedded using `text-embedding-3-small` (1536 dimensions)
4. **Storage**: Chunks and embeddings are stored in `document_chunks` table

## Query Processing

1. **Embed Query**: User query is converted to a vector embedding
2. **Vector Search**: Top 8 most similar chunks are retrieved (cosine similarity)
3. **Context Formatting**: Retrieved chunks are formatted with citation IDs (c1, c2, ...)
4. **LLM Generation**: Context and query are sent to Gemini 2.0 Flash
5. **Response Parsing**: JSON response is parsed and citation markers are extracted
6. **Persistence**: Message and citations are saved to database

## Citation System

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
