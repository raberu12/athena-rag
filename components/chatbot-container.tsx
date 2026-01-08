"use client"

import { useState, useCallback, useEffect } from "react"
import { DocumentDrawer } from "./document-drawer"
import { ChatPanel } from "./chat-panel"
import type { Document } from "@/types/rag"

/**
 * Standalone ChatbotContainer for simpler use cases without authentication.
 * For authenticated usage with conversation persistence, use AuthenticatedApp instead.
 */
export function ChatbotContainer() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)
  const [hasDrawerBeenClosed, setHasDrawerBeenClosed] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const [greetingComplete, setGreetingComplete] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const handleDocumentUpload = useCallback((newDocuments: Document[]) => {
    setDocuments((prev) => [...prev, ...newDocuments])
    setSelectedDocIds((prev) => [...prev, ...newDocuments.map((d) => d.id)])
  }, [])

  const handleRemoveDocument = useCallback(async (docId: string) => {
    // Remove from vector store via API
    try {
      await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      })
    } catch (error) {
      console.error("Failed to remove document from backend:", error)
    }

    setDocuments((prev) => prev.filter((d) => d.id !== docId))
    setSelectedDocIds((prev) => prev.filter((id) => id !== docId))
  }, [])

  const handleToggleDocument = useCallback((docId: string) => {
    setSelectedDocIds((prev) => (prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]))
  }, [])

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false)

    // Trigger greeting on first drawer close
    if (!hasDrawerBeenClosed && !greetingComplete) {
      setHasDrawerBeenClosed(true)
      setShowGreeting(true)
    }
  }, [hasDrawerBeenClosed, greetingComplete])

  const handleToggleDrawer = useCallback(() => {
    if (isDrawerOpen) {
      handleDrawerClose()
    } else {
      setIsDrawerOpen(true)
    }
  }, [isDrawerOpen, handleDrawerClose])

  const handleGreetingComplete = useCallback(() => {
    setGreetingComplete(true)
    setShowGreeting(false)
  }, [])

  // Create a conversation on mount for standalone mode
  useEffect(() => {
    const createConversation = async () => {
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        if (response.ok) {
          const data = await response.json()
          setConversationId(data.conversation?.id || null)
        }
      } catch (error) {
        console.error("Failed to create conversation:", error)
      }
    }
    createConversation()
  }, [])

  // Auto-close drawer and trigger greeting when first document is uploaded
  const [hasAutoClosedOnUpload, setHasAutoClosedOnUpload] = useState(false)

  useEffect(() => {
    if (documents.length > 0 && isDrawerOpen && !hasAutoClosedOnUpload) {
      setHasAutoClosedOnUpload(true)
      handleDrawerClose()
    }
  }, [documents.length, isDrawerOpen, hasAutoClosedOnUpload, handleDrawerClose])

  // No-op for sidebar toggle in standalone mode
  const handleToggleSidebar = useCallback(() => { }, [])

  // No-op for conversation update in standalone mode
  const handleConversationUpdate = useCallback(() => { }, [])

  return (
    <div className="flex h-full w-full flex-col">
      {/* Drawer */}
      <DocumentDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        documents={documents}
        selectedDocIds={selectedDocIds}
        onUpload={handleDocumentUpload}
        onRemove={handleRemoveDocument}
        onToggle={handleToggleDocument}
      />

      {/* Main Chat Area */}
      <ChatPanel
        documents={documents}
        selectedDocIds={selectedDocIds}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={handleToggleDrawer}
        showGreeting={showGreeting}
        onGreetingComplete={handleGreetingComplete}
        conversationId={conversationId}
        onToggleSidebar={handleToggleSidebar}
        userEmail="guest@example.com"
        onConversationUpdate={handleConversationUpdate}
      />
    </div>
  )
}
