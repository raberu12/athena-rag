"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Loader, MessageSquarePlus, FileText } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { TypingMessage } from "./typing-message";
import { UserMenu } from "./user-menu";
import type { Document, Message, CitationData } from "@/types/rag";

interface ChatPanelProps {
  documents: Document[];
  selectedDocIds: string[];
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  showGreeting: boolean;
  onGreetingComplete: () => void;
  conversationId: string | null;
  onToggleSidebar: () => void;
  userEmail: string;
  onConversationUpdate: () => void;
}

const GREETING_MESSAGE =
  "Hello! Upload documents and ask me questions about them. I'll search through your documents to provide relevant answers.";

export function ChatPanel({
  documents,
  selectedDocIds,
  isDrawerOpen,
  onToggleDrawer,
  showGreeting,
  onGreetingComplete,
  conversationId,
  onToggleSidebar,
  userEmail,
  onConversationUpdate,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTypingGreeting, setIsTypingGreeting] = useState(false);
  const [greetingShown, setGreetingShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTypingGreeting]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      const loadMessages = async () => {
        try {
          const response = await fetch(`/api/conversations/${conversationId}`);
          if (response.ok) {
            const data = await response.json();
            const loadedMessages: Message[] = (data.messages || []).map(
              (msg: { id: string; role: "user" | "assistant"; content: string; created_at: string; citations?: CitationData[] | null }) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.created_at),
                citations: msg.citations || undefined,
              })
            );
            setMessages(loadedMessages);
            setGreetingShown(loadedMessages.length > 0);
          }
        } catch (error) {
          console.error("Failed to load messages:", error);
        }
      };

      loadMessages();
    } else {
      setMessages([]);
      setGreetingShown(false);
    }
  }, [conversationId]);

  // Trigger greeting animation when showGreeting becomes true
  useEffect(() => {
    if (showGreeting && !greetingShown && messages.length === 0) {
      setIsTypingGreeting(true);
    }
  }, [showGreeting, greetingShown, messages.length]);

  const handleGreetingComplete = useCallback(() => {
    setIsTypingGreeting(false);
    setGreetingShown(true);

    // Add the completed message to the messages array
    const greetingMessage: Message = {
      id: "greeting",
      role: "assistant",
      content: GREETING_MESSAGE,
      timestamp: new Date(),
    };
    setMessages([greetingMessage]);
    onGreetingComplete();
  }, [onGreetingComplete]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send query with conversationId for persistence
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
          conversationId,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.error || "No response received",
        timestamp: new Date(),
        citations: data.citations, // Include citations from API response
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onConversationUpdate(); // Refresh conversations list to update title
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your query. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleDrawer}>
            <FileText className="h-5 w-5" />
          </Button>
          <div>
            <h1
              className="text-4xl font-semibold text-foreground"
              style={{ fontFamily: '"Aldrich", sans-serif' }}
            >
              Athena
            </h1>
            <p className="text-xs text-muted-foreground">
              {selectedDocIds.length > 0
                ? `Document(s) loaded ${selectedDocIds.length}`
                : "No documents selected"}
            </p>
          </div>
        </div>
        <UserMenu email={userEmail} />
      </div>

      {/* Main content area with padding */}
      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden">

        {/* No conversation selected state */}
        {!conversationId && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquarePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No conversation selected</p>
              <p className="text-sm">Create a new conversation to get started</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {conversationId && (
          <>
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
              {!isTypingGreeting &&
                messages.map((message) => <ChatMessage key={message.id} message={message} />)}

              {isLoading && (
                <div className="flex justify-start">
                  <Card className="px-4 py-3 border bg-accent/20 text-foreground">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </Card>
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
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || isTypingGreeting || !input.trim()}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
