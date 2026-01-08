"use client";

import { useState, useCallback, useEffect } from "react";
import { DocumentDrawer } from "./document-drawer";
import { ChatPanel } from "./chat-panel";
import { ConversationSidebar, type ConversationItem } from "./conversation-sidebar";
import type { Document } from "@/types/rag";

interface AuthenticatedAppProps {
    userEmail: string;
}

export function AuthenticatedApp({ userEmail }: AuthenticatedAppProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [showGreeting, setShowGreeting] = useState(false);
    const [greetingComplete, setGreetingComplete] = useState(false);

    // Fetch conversations on mount
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await fetch("/api/conversations");
                if (response.ok) {
                    const data = await response.json();
                    setConversations(data.conversations || []);
                }
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
            }
        };

        fetchConversations();
    }, []);

    // Fetch documents on mount
    useEffect(() => {
        const fetchDocuments = async () => {
            console.log("[AuthenticatedApp] Fetching documents...");
            try {
                const response = await fetch("/api/documents");
                console.log("[AuthenticatedApp] Documents response:", response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log("[AuthenticatedApp] Documents data:", data);
                    const docs: Document[] = (data.documents || []).map((doc: { id: string; name: string; size_bytes: number; created_at: string }) => ({
                        id: doc.id,
                        name: doc.name,
                        content: "",
                        size: doc.size_bytes,
                        uploadedAt: new Date(doc.created_at),
                        processed: true,
                    }));
                    setDocuments(docs);
                    setSelectedDocIds(docs.map((d) => d.id));
                }
            } catch (error) {
                console.error("Failed to fetch documents:", error);
            }
        };

        fetchDocuments();
    }, []);

    const handleNewConversation = useCallback(async () => {
        try {
            const response = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            if (response.ok) {
                const data = await response.json();
                setConversations((prev) => [data.conversation, ...prev]);
                setCurrentConversationId(data.conversation.id);
                setShowGreeting(true);
                setGreetingComplete(false);
            }
        } catch (error) {
            console.error("Failed to create conversation:", error);
        }
    }, []);

    const handleSelectConversation = useCallback((id: string) => {
        setCurrentConversationId(id);
        setShowGreeting(false);
        setGreetingComplete(true);
    }, []);

    const handleDeleteConversation = useCallback(async (id: string) => {
        try {
            await fetch("/api/conversations", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId: id }),
            });

            setConversations((prev) => prev.filter((c) => c.id !== id));

            if (currentConversationId === id) {
                setCurrentConversationId(null);
            }
        } catch (error) {
            console.error("Failed to delete conversation:", error);
        }
    }, [currentConversationId]);

    const handleDocumentUpload = useCallback((newDocuments: Document[]) => {
        setDocuments((prev) => [...prev, ...newDocuments]);
        setSelectedDocIds((prev) => [...prev, ...newDocuments.map((d) => d.id)]);
    }, []);

    const handleRemoveDocument = useCallback(async (docId: string) => {
        try {
            await fetch("/api/documents", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId: docId }),
            });
        } catch (error) {
            console.error("Failed to remove document from backend:", error);
        }

        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        setSelectedDocIds((prev) => prev.filter((id) => id !== docId));
    }, []);

    const handleToggleDocument = useCallback((docId: string) => {
        setSelectedDocIds((prev) =>
            prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
        );
    }, []);

    const handleDrawerClose = useCallback(() => {
        setIsDrawerOpen(false);
    }, []);

    const handleToggleDrawer = useCallback(() => {
        setIsDrawerOpen((prev) => !prev);
    }, []);

    const handleGreetingComplete = useCallback(() => {
        setGreetingComplete(true);
        setShowGreeting(false);
    }, []);

    const refreshConversations = useCallback(async () => {
        try {
            const response = await fetch("/api/conversations");
            if (response.ok) {
                const data = await response.json();
                setConversations(data.conversations || []);
            }
        } catch (error) {
            console.error("Failed to refresh conversations:", error);
        }
    }, []);

    return (
        // Flex layout: sidebar + main content side by side
        <div className="flex h-full w-full">
            {/* Sidebar wrapper - animated width transition */}
            <div
                className="shrink-0 h-full overflow-hidden transition-all duration-200 ease-in-out"
                style={{ width: isSidebarOpen ? 256 : 0 }}
            >
                <ConversationSidebar
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onSelectConversation={handleSelectConversation}
                    onNewConversation={handleNewConversation}
                    onDeleteConversation={handleDeleteConversation}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>

            {/* Main Content - takes remaining space */}
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                {/* Document Drawer */}
                <DocumentDrawer
                    isOpen={isDrawerOpen}
                    onClose={handleDrawerClose}
                    documents={documents}
                    selectedDocIds={selectedDocIds}
                    onUpload={handleDocumentUpload}
                    onRemove={handleRemoveDocument}
                    onToggle={handleToggleDocument}
                />

                {/* Chat Panel */}
                <ChatPanel
                    documents={documents}
                    selectedDocIds={selectedDocIds}
                    isDrawerOpen={isDrawerOpen}
                    onToggleDrawer={handleToggleDrawer}
                    showGreeting={showGreeting && !greetingComplete}
                    onGreetingComplete={handleGreetingComplete}
                    conversationId={currentConversationId}
                    onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                    userEmail={userEmail}
                    onConversationUpdate={refreshConversations}
                />
            </div>
        </div>
    );
}
