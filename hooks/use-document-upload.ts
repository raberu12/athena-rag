/**
 * Hook for document upload functionality
 * Consolidates file processing logic from document components
 */

import { useState, useRef, useCallback } from "react";
import type { Document } from "@/types/rag";

interface UseDocumentUploadOptions {
    onUpload: (documents: Document[]) => void;
    onError?: (error: string) => void;
}

interface UseDocumentUploadReturn {
    isLoading: boolean;
    isDragging: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDragLeave: () => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    openFileDialog: () => void;
}

/**
 * Hook for handling document uploads with drag-and-drop support
 */
export function useDocumentUpload({
    onUpload,
    onError,
}: UseDocumentUploadOptions): UseDocumentUploadReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const processFiles = useCallback(async (files: File[]) => {
        setIsLoading(true);
        try {
            const newDocuments: Document[] = [];

            for (const file of files) {
                const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");

                // Upload file to backend for processing
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/documents", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`Failed to process file: ${errorData.error}`);
                    onError?.(`Failed to process ${file.name}: ${errorData.error}`);
                    continue;
                }

                const result = await response.json();
                console.log(`Document processed: ${result.document?.chunkCount} chunks`);

                const serverDocId = result.document?.id;

                if (!serverDocId) {
                    console.error("No document ID returned from server");
                    onError?.(`No document ID returned for ${file.name}`);
                    continue;
                }

                if (isPDF) {
                    const doc: Document = {
                        id: serverDocId,
                        name: file.name,
                        content: `[PDF processed - ${result.document?.chunkCount || 0} chunks]`,
                        uploadedAt: new Date(),
                        size: file.size,
                        processed: true,
                    };
                    newDocuments.push(doc);
                } else {
                    const text = await file.text();
                    const doc: Document = {
                        id: serverDocId,
                        name: file.name,
                        content: text.substring(0, 500) + (text.length > 500 ? "..." : ""),
                        uploadedAt: new Date(),
                        size: file.size,
                        processed: true,
                    };
                    newDocuments.push(doc);
                }
            }

            if (newDocuments.length > 0) {
                onUpload(newDocuments);
            }
        } catch (error) {
            console.error("Error processing files:", error);
            onError?.("Failed to upload documents");
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [onUpload, onError]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }, [processFiles]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.currentTarget.files || []);
        processFiles(files);
    }, [processFiles]);

    const openFileDialog = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return {
        isLoading,
        isDragging,
        fileInputRef,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleFileSelect,
        openFileDialog,
    };
}
