/**
 * Single Conversation API Routes
 * GET - Get conversation with messages
 * PATCH - Update conversation title
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConversation, updateConversation } from "@/lib/db/conversations";
import { getMessages } from "@/lib/db/messages";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const conversation = await getConversation(id);

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        // Verify ownership
        if (conversation.user_id !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const messages = await getMessages(id);
        return NextResponse.json({ conversation, messages });
    } catch (error) {
        console.error("[Conversation API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversation" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const conversation = await getConversation(id);

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        // Verify ownership
        if (conversation.user_id !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const updated = await updateConversation(id, { title: body.title });

        return NextResponse.json({ conversation: updated });
    } catch (error) {
        console.error("[Conversation API] Error:", error);
        return NextResponse.json(
            { error: "Failed to update conversation" },
            { status: 500 }
        );
    }
}
