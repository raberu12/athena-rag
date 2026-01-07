"use client"

import { useState, useCallback, useEffect } from "react"
import { DocumentDrawer } from "./document-drawer"
import { ChatPanel } from "./chat-panel"
import type { Document } from "@/types/rag"

export function ChatbotContainer() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)
  const [hasDrawerBeenClosed, setHasDrawerBeenClosed] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const [greetingComplete, setGreetingComplete] = useState(false)

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

  // Auto-close drawer and trigger greeting when first document is uploaded
  const [hasAutoClosedOnUpload, setHasAutoClosedOnUpload] = useState(false)

  useEffect(() => {
    if (documents.length > 0 && isDrawerOpen && !hasAutoClosedOnUpload) {
      setHasAutoClosedOnUpload(true)
      handleDrawerClose()
    }
  }, [documents.length, isDrawerOpen, hasAutoClosedOnUpload, handleDrawerClose])

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
      />
    </div>
  )
}

