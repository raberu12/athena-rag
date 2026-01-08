"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Upload, FileText, Loader } from "lucide-react"
import type { Document } from "@/types/rag"

interface DocumentDrawerProps {
  isOpen: boolean
  onClose: () => void
  documents: Document[]
  selectedDocIds: string[]
  onUpload: (documents: Document[]) => void
  onRemove: (docId: string) => void
  onToggle: (docId: string) => void
}

export function DocumentDrawer({
  isOpen,
  onClose,
  documents,
  selectedDocIds,
  onUpload,
  onRemove,
  onToggle,
}: DocumentDrawerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || [])
    processFiles(files)
  }

  const processFiles = async (files: File[]) => {
    setIsLoading(true)
    try {
      const newDocuments: Document[] = []

      for (const file of files) {
        const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf")

        // Upload file to backend for processing (server generates the document ID)
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`Failed to process file: ${errorData.error}`)
          continue
        }

        const result = await response.json()
        console.log(`Document processed: ${result.document?.chunkCount} chunks`)

        // Use the server-generated document ID
        const serverDocId = result.document?.id

        if (!serverDocId) {
          console.error("No document ID returned from server")
          continue
        }

        if (isPDF) {
          const doc: Document = {
            id: serverDocId,
            name: file.name,
            content: `[PDF processed - ${result.document?.chunkCount || 0} chunks]`,
            uploadedAt: new Date(),
            size: file.size,
            processed: true,
          }
          newDocuments.push(doc)
        } else {
          const text = await file.text()
          const doc: Document = {
            id: serverDocId,
            name: file.name,
            content: text.substring(0, 500) + (text.length > 500 ? "..." : ""),
            uploadedAt: new Date(),
            size: file.size,
            processed: true,
          }
          newDocuments.push(doc)
        }
      }

      onUpload(newDocuments)
    } catch (error) {
      console.error("Error processing files:", error)
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={onClose}
          aria-label="Close drawer"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed left-0 top-0 z-50 h-full w-80 transform bg-background transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col gap-4 p-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Documents</h2>
              <p className="text-xs text-muted-foreground">Upload files to include in your queries</p>
            </div>
            <button onClick={onClose} className="rounded p-1 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/30"
              }`}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <div className="text-center">
              <p className="text-xs font-medium text-foreground">Drag files here</p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader className="h-3 w-3 animate-spin" />
                  Loading...
                </>
              ) : (
                "Select Files"
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.pdf,.md,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto">
            {documents.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No documents</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    className={`cursor-pointer transition-all border ${selectedDocIds.includes(doc.id) ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"
                      }`}
                    onClick={() => onToggle(doc.id)}
                  >
                    <div className="flex items-start gap-3 p-3">
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc.id)}
                        onChange={() => onToggle(doc.id)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{(doc.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemove(doc.id)
                        }}
                        className="rounded p-1 hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
