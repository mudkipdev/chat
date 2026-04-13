import { json, error } from "@sveltejs/kit";
import { db, messages } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, request }) => {
    const body = (await request.json()) as {
        id?: string;
        role?: "user" | "assistant" | "tool";
        content?: string;
        metadata?: string | null;
    };

    if (!body.id || !body.role || body.content == null) {
        throw error(400, "id, role, content required");
    }

    await db
        .insert(messages)
        .values({
            id: body.id,
            conversationId: params.id,
            role: body.role,
            content: body.content,
            metadata: body.metadata ?? null,
        })
        .onConflictDoUpdate({
            target: messages.id,
            set: {
                content: body.content,
                metadata: body.metadata ?? null,
            },
        });

    return json({ ok: true });
};
