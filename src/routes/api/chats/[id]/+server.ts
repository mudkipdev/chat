import { json, error } from "@sveltejs/kit";
import { eq, asc } from "drizzle-orm";
import { db, conversations, messages } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
    const chat = await db.query.conversations.findFirst({
        where: eq(conversations.id, params.id),
    });
    if (!chat) throw error(404, "not found");

    const rows = await db
        .select({
            id: messages.id,
            role: messages.role,
            content: messages.content,
            thinking: messages.thinking,
            model: messages.model,
            toolCalls: messages.toolCalls,
        })
        .from(messages)
        .where(eq(messages.conversationId, params.id))
        .orderBy(asc(messages.createdAt));

    return json({ id: chat.id, messages: rows });
};
