import { json, error } from "@sveltejs/kit";
import { db, messages } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, request }) => {
    const body = (await request.json()) as {
        id?: string;
        role?: "user" | "assistant";
        content?: string;
        thinking?: string | null;
        model?: string | null;
    };

    if (!body.id || !body.role || !body.content) {
        throw error(400, "id, role, content required");
    }

    await db
        .insert(messages)
        .values({
            id: body.id,
            conversationId: params.id,
            role: body.role,
            content: body.content,
            thinking: body.thinking ?? null,
            model: body.model ?? null,
        })
        .onConflictDoUpdate({
            target: messages.id,
            set: {
                content: body.content,
                thinking: body.thinking ?? null,
                model: body.model ?? null,
            },
        });

    return json({ ok: true });
};
