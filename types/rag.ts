export interface Document {
  id: string
  name: string
  content: string
  uploadedAt: Date
  size: number
  processed?: boolean
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface ChatRequest {
  query: string
  documentIds?: string[]
  conversationId?: string
}

export interface ChatResponse {
  response: string
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
