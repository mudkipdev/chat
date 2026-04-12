import { json, error } from "@sveltejs/kit";
import { asc, desc, eq } from "drizzle-orm";
import { db, conversations, messages } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    const rows = await db
        .select({
            id: conversations.id,
            title: conversations.title,
            createdAt: conversations.createdAt,
        })
        .from(conversations)
        .orderBy(desc(conversations.createdAt));

    const results = await Promise.all(
        rows.map(async (row) => {
            const first = await db
                .select({ content: messages.content })
                .from(messages)
                .where(eq(messages.conversationId, row.id))
                .orderBy(asc(messages.createdAt))
                .limit(1);
            return {
                id: row.id,
                title: row.title,
                firstMessage: first[0]?.content ?? "",
                createdAt: row.createdAt.getTime(),
            };
        }),
    );

    return json(results);
};

export const POST: RequestHandler = async ({ request }) => {
    const { id, messageId, content } = (await request.json()) as {
        id?: string;
        messageId?: string;
        content?: string;
    };
    if (!id || !messageId || !content?.trim()) {
        throw error(400, "id, messageId, content required");
    }

    await db.insert(conversations).values({ id });
    await db.insert(messages).values({
        id: messageId,
        conversationId: id,
        role: "user",
        content,
    });

    return json({ ok: true });
};
