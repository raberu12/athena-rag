export interface Document {
  id: string
  name: string
  content: string
  uploadedAt: Date
  size: number
  processed?: boolean
}

// Citation types for interactive Wikipedia-style citations
export interface CitationMetadata {
  source: string
  page?: string
  url?: string
  chunkIndex?: number
}

export interface CitationData {
  id: string          // c1, c2, c3...
  snippet: string     // 150-250 chars preview for tooltip
  content: string     // full chunk content for modal
  metadata: CitationMetadata
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  citations?: CitationData[]  // optional citations for assistant messages
}

export interface ChatRequest {
  query: string
  documentIds?: string[]
  conversationId?: string
}

export interface ChatResponse {
  response: string
  citations?: CitationData[]  // optional citations in response
}

// Structured response format expected from LLM
export interface StructuredLLMResponse {
  answer: string      // contains {{cite:cX}} markers
  citations: CitationData[]
}

export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
}

export interface DocumentUploadResponse {
  success: boolean
  document?: {
    id: string
    name: string
    chunkCount: number
    processedAt: Date
  }
  error?: string
}
