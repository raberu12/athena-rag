import { generateText } from "ai"
import type { ChatRequest, ChatResponse } from "@/types/rag"

export async function POST(request: Request) {
  const { query, context, hasDocuments } = (await request.json()) as ChatRequest

  try {
    const systemPrompt = hasDocuments
      ? `You are a helpful assistant that answers questions based on provided documents. 
      Answer the user's question using only the information from the provided context. 
      If the context doesn't contain relevant information, say so clearly.
      Be concise and accurate in your responses.`
      : `You are a helpful assistant. Answer the user's question helpfully and accurately.`

    const userPrompt = context ? `Context from documents:\n${context}\n\nQuestion: ${query}` : `Question: ${query}`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      prompt: userPrompt,
    })

    const response: ChatResponse = {
      response: text,
    }

    return Response.json(response)
  } catch (error) {
    console.error("Chat error:", error)
    return Response.json({ error: "Failed to process request" }, { status: 500 })
  }
}
