import { json, error } from "@sveltejs/kit";
import { eq, asc, and } from "drizzle-orm";
import { db, conversations, messages } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, params }) => {
    if (!locals.user) throw error(401, "unauthorized");

    const chat = await db.query.conversations.findFirst({
        where: and(
            eq(conversations.id, params.id),
            eq(conversations.userId, locals.user.id),
        ),
    });
    if (!chat) throw error(404, "not found");

    const rows = await db
        .select({
            id: messages.id,
            role: messages.role,
            content: messages.content,
            metadata: messages.metadata,
        })
        .from(messages)
        .where(eq(messages.conversationId, params.id))
        .orderBy(asc(messages.createdAt));

    return json({ id: chat.id, messages: rows });
};
