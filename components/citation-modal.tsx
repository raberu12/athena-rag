"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, BookOpen } from "lucide-react";
import type { CitationData } from "@/types/rag";

interface CitationModalProps {
    citation: CitationData | null;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal to display full citation content and metadata
 */
export function CitationModal({ citation, isOpen, onClose }: CitationModalProps) {
    if (!citation) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Source: {citation.metadata.source}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-4 text-sm">
                        {citation.metadata.chunkIndex !== undefined && (
                            <span className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                Chunk {citation.metadata.chunkIndex + 1}
                            </span>
                        )}
                        {citation.metadata.page && (
                            <span>Page {citation.metadata.page}</span>
                        )}
                        {citation.metadata.url && (
                            <a
                                href={citation.metadata.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                View source
                            </a>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="mt-4 max-h-[50vh]">
                    <div className="pr-4">
                        <div className="rounded-lg bg-muted/50 p-4 border border-border">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {citation.content}
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
