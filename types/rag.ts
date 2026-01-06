export interface Document {
  id: string
  name: string
  content: string
  uploadedAt: Date
  size: number
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface ChatRequest {
  query: string
  context: string | null
  hasDocuments: boolean
}

export interface ChatResponse {
  response: string
}
