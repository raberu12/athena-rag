/**
 * Conversations API Routes
 * GET - List user's conversations
 * POST - Create new conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConversations, createConversation, deleteConversation } from "@/lib/db/conversations";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const conversations = await getConversations(user.id);
        return NextResponse.json({ conversations });
    } catch (error) {
        console.error("[Conversations API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversations" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const title = body.title || "New Chat";

        const conversation = await createConversation(user.id, title);
        return NextResponse.json({ conversation }, { status: 201 });
    } catch (error) {
        console.error("[Conversations API] Error:", error);
        return NextResponse.json(
            { error: "Failed to create conversation" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { conversationId } = body;

        if (!conversationId) {
            return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
        }

        await deleteConversation(conversationId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Conversations API] Error:", error);
        return NextResponse.json(
            { error: "Failed to delete conversation" },
            { status: 500 }
        );
    }
}
