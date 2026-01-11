"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConversationItem {
    id: string;
    title: string;
    updated_at: string;
}

interface ConversationSidebarProps {
    conversations: ConversationItem[];
    currentConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onNewConversation: () => void;
    onDeleteConversation: (id: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function ConversationSidebar({
    conversations,
    currentConversationId,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
    isOpen,
    onClose,
}: ConversationSidebarProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeletingId(id);
        await onDeleteConversation(id);
        setDeletingId(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return "Today";
        if (diffInDays === 1) return "Yesterday";
        if (diffInDays < 7) return `${diffInDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar - fixed width content, parent controls visibility via overflow */}
            <div
                className={cn(
                    "h-full w-64 flex flex-col",
                    "bg-sidebar border-r border-sidebar-border",
                    // Mobile: fixed overlay
                    "max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:z-50",
                    "max-lg:transition-transform max-lg:duration-200",
                    isOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-sidebar-border shrink-0">
                    <h2 className="text-sm font-semibold text-sidebar-foreground">Conversations</h2>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onNewConversation}
                            title="New conversation"
                            className="h-8 w-8"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            title="Close sidebar"
                            className="h-8 w-8"
                        >
                            <PanelLeftClose className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Conversation List - simple overflow scroll */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {conversations.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <p className="text-sm text-sidebar-foreground/60">
                                No conversations yet
                            </p>
                            <p className="text-xs text-sidebar-foreground/40 mt-1">
                                Click + to start a new chat
                            </p>
                        </div>
                    ) : (
                        conversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                onClick={() => onSelectConversation(conversation.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
                                    "transition-colors duration-150",
                                    "hover:bg-muted/30",
                                    currentConversationId === conversation.id && "bg-muted/40"
                                )}
                            >
                                <MessageSquare className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                                        {conversation.title}
                                    </p>
                                    <p className="text-xs text-sidebar-foreground/60">
                                        {formatDate(conversation.updated_at)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 opacity-60 hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
                                    onClick={(e) => handleDelete(e, conversation.id)}
                                    disabled={deletingId === conversation.id}
                                    title="Delete conversation"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
