# API Reference

## Endpoints

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

## Chat Endpoint

### POST /api/chat

Send a user query and receive a RAG-augmented response with citations.

**Request Body:**
```json
{
  "message": "What does the document say about X?",
  "conversationId": "uuid-string"
}
```

**Response:**
```json
{
  "response": "According to the document...",
  "citations": [
    {
      "id": "c1",
      "content": "...",
      "documentName": "example.pdf",
      "chunkIndex": 0
    }
  ]
}
```

## Document Upload

### POST /api/documents

Upload and process a document for RAG retrieval.

**Request:** `multipart/form-data` with `file` field

**Supported Types:**
- PDF (`.pdf`)
- Markdown (`.md`)
- JSON (`.json`)
- Plain Text (`.txt`)

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid-string",
    "name": "example.pdf",
    "chunkCount": 42,
    "processedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Authentication

All endpoints require authentication via Supabase Auth. Include the session cookie or JWT token in requests.

Unauthorized requests return:
```json
{
  "error": "Unauthorized"
}
```
