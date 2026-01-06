"use client"

import { Card } from "@/components/ui/card"
import type { Message } from "@/types/rag"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <Card
        className={`max-w-xs px-4 py-3 border ${isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        <p className={`mt-1 text-xs ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </Card>
    </div>
  )
}
