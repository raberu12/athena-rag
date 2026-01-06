"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Menu, Send, Loader } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { TypingMessage } from "./typing-message"
import type { Document, Message } from "@/types/rag"

interface ChatPanelProps {
  documents: Document[]
  selectedDocIds: string[]
  isDrawerOpen: boolean
  onToggleDrawer: () => void
  showGreeting: boolean
  onGreetingComplete: () => void
}

const GREETING_MESSAGE = "Hello! Upload documents and ask me questions about them. I'll search through your documents to provide relevant answers."

export function ChatPanel({
  documents,
  selectedDocIds,
  isDrawerOpen,
  onToggleDrawer,
  showGreeting,
  onGreetingComplete
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTypingGreeting, setIsTypingGreeting] = useState(false)
  const [greetingShown, setGreetingShown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTypingGreeting])

  // Trigger greeting animation when showGreeting becomes true
  useEffect(() => {
    if (showGreeting && !greetingShown) {
      setIsTypingGreeting(true)
    }
  }, [showGreeting, greetingShown])

  const handleGreetingComplete = useCallback(() => {
    setIsTypingGreeting(false)
    setGreetingShown(true)

    // Add the completed message to the messages array
    const greetingMessage: Message = {
      id: "greeting",
      role: "assistant",
      content: GREETING_MESSAGE,
      timestamp: new Date(),
    }
    setMessages([greetingMessage])
    onGreetingComplete()
  }, [onGreetingComplete])

  const getRelevantContext = (query: string): string => {
    const selectedDocs = documents.filter((d) => selectedDocIds.includes(d.id))

    if (selectedDocs.length === 0) {
      return ""
    }

    // Simple keyword matching for RAG simulation
    const keywords = query.toLowerCase().split(/\s+/)
    let context = ""

    for (const doc of selectedDocs) {
      const content = doc.content.toLowerCase()
      let docRelevance = 0

      for (const keyword of keywords) {
        if (keyword.length > 2) {
          const matches = (content.match(new RegExp(keyword, "g")) || []).length
          docRelevance += matches
        }
      }

      if (docRelevance > 0) {
        const contentPreview = doc.content.substring(0, 500)
        context += `\n[From ${doc.name}]:\n${contentPreview}...\n`
      }
    }

    return context
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const context = getRelevantContext(input)
      const hasDocuments = selectedDocIds.length > 0

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          context: context || null,
          hasDocuments,
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your query. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onToggleDrawer}>
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-semibold text-foreground" style={{ fontFamily: '"Aldrich", sans-serif' }}>
              Athena
            </h1>
            <p className="text-xs text-muted-foreground">
              {selectedDocIds.length > 0 ? `Document(s) loaded ${selectedDocIds.length}` : "No documents selected"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {/* Show typing animation for greeting */}
        {isTypingGreeting && (
          <TypingMessage
            content={GREETING_MESSAGE}
            onComplete={handleGreetingComplete}
            typingSpeed={25}
          />
        )}

        {/* Show completed messages (after greeting is done) */}
        {!isTypingGreeting && messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex justify-center">
            <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <Card className="p-4 border rounded-full">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ask me a question!"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || isTypingGreeting}
            className="flex-1 bg-background px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button onClick={handleSendMessage} disabled={isLoading || isTypingGreeting || !input.trim()} size="icon">
            {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  )
}
