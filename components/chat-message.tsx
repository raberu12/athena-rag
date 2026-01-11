"use client"

import { useState, useMemo, Fragment } from "react"
import { Card } from "@/components/ui/card"
import { CitationMarker } from "./citation-marker"
import { CitationModal } from "./citation-modal"
import { parseAnswerWithCitations, hasCitations } from "@/lib/citations/parser"
import type { Message, CitationData } from "@/types/rag"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const [selectedCitation, setSelectedCitation] = useState<CitationData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Check if content has citation markers
  const hasMarkers = useMemo(() => {
    if (isUser) return false
    return hasCitations(message.content)
  }, [message.content, isUser])

  // Parse content to extract citation markers (for assistant messages with markers)
  const contentParts = useMemo(() => {
    if (isUser || !hasMarkers) {
      return null
    }
    return parseAnswerWithCitations(message.content)
  }, [message.content, hasMarkers, isUser])

  // Create a map of citation ID to citation data and display number
  const citationMap = useMemo(() => {
    if (!message.citations) return new Map<string, { citation: CitationData; displayNumber: number }>()

    const map = new Map<string, { citation: CitationData; displayNumber: number }>()
    message.citations.forEach((citation, index) => {
      map.set(citation.id, { citation, displayNumber: index + 1 })
    })
    return map
  }, [message.citations])

  const handleCitationClick = (citationId: string) => {
    const citationInfo = citationMap.get(citationId)
    if (citationInfo) {
      setSelectedCitation(citationInfo.citation)
      setIsModalOpen(true)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCitation(null)
  }

  // Render content with inline citations
  const renderContent = () => {
    // User messages: render plain text
    if (isUser) {
      return <span>{message.content}</span>
    }

    // No citation markers in content: render plain text
    if (!contentParts) {
      return <span>{message.content}</span>
    }

    // Has citation markers - render with citation components or stripped
    const hasCitationData = message.citations && message.citations.length > 0

    return (
      <>
        {contentParts.map((part, index) => {
          if (part.type === "text") {
            return <Fragment key={index}>{part.content}</Fragment>
          }

          // For citation markers:
          // - If we have citation data, render the marker component
          // - If no citation data, skip the marker (don't show raw text)
          const citationInfo = citationMap.get(part.id)

          if (!citationInfo) {
            // No citation data for this ID - skip it entirely
            // This handles both: missing citations array AND unknown citation IDs
            return null
          }

          return (
            <CitationMarker
              key={`${part.id}-${index}`}
              citation={citationInfo.citation}
              displayNumber={citationInfo.displayNumber}
              onClick={() => handleCitationClick(part.id)}
            />
          )
        })}
      </>
    )
  }

  return (
    <>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <Card
          className={`max-w-xs px-4 py-3 border ${isUser ? "bg-primary text-primary-foreground" : "bg-accent/20 text-foreground"}`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {renderContent()}
          </p>
          <p className={`mt-1 text-xs ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {message.timestamp.toLocaleTimeString()}
          </p>
        </Card>
      </div>

      {/* Citation Modal */}
      <CitationModal
        citation={selectedCitation}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </>
  )
}


