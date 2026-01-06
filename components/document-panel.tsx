"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Upload, FileText, Loader } from "lucide-react"
import type { Document } from "@/types/rag"

interface DocumentPanelProps {
  documents: Document[]
  selectedDocIds: string[]
  onUpload: (documents: Document[]) => void
  onRemove: (docId: string) => void
  onToggle: (docId: string) => void
}

export function DocumentPanel({ documents, selectedDocIds, onUpload, onRemove, onToggle }: DocumentPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        const text = await file.text()
        const doc: Document = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          content: text,
          uploadedAt: new Date(),
          size: file.size,
        }
        newDocuments.push(doc)
      }

      onUpload(newDocuments)
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Documents</h2>
        <p className="text-sm text-muted-foreground">Upload files to include in your queries</p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/30"
        }`}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Drag files here</p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
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
                className={`cursor-pointer transition-all ${
                  selectedDocIds.includes(doc.id) ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"
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
  )
}
