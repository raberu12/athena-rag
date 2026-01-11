"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"

interface TypingMessageProps {
    content: string
    onComplete?: () => void
    typingSpeed?: number
}

export function TypingMessage({ content, onComplete, typingSpeed = 30 }: TypingMessageProps) {
    const [displayedContent, setDisplayedContent] = useState("")
    const [isComplete, setIsComplete] = useState(false)
    const [timestamp] = useState(new Date())

    useEffect(() => {
        if (displayedContent.length < content.length) {
            const timeout = setTimeout(() => {
                setDisplayedContent(content.slice(0, displayedContent.length + 1))
            }, typingSpeed)
            return () => clearTimeout(timeout)
        } else {
            setIsComplete(true)
            onComplete?.()
        }
    }, [content, displayedContent, typingSpeed, onComplete])

    return (
        <div className="flex justify-start">
            <Card className="max-w-xs px-4 py-3 border bg-accent/20 text-foreground">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {displayedContent}
                    {!isComplete && (
                        <span className="inline-block w-2 h-4 ml-0.5 bg-foreground animate-pulse" />
                    )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {timestamp.toLocaleTimeString()}
                </p>
            </Card>
        </div>
    )
}
