import { json, error } from "@sveltejs/kit";
import { db, messages } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, request }) => {
    const body = (await request.json()) as {
        id?: string;
        role?: "user" | "assistant" | "tool";
        content?: string;
        thinking?: string | null;
        model?: string | null;
        toolCalls?: string | null;
        error?: string | null;
        steps?: string | null;
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
            thinking: body.thinking ?? null,
            model: body.model ?? null,
            toolCalls: body.toolCalls ?? null,
            error: body.error ?? null,
            steps: body.steps ?? null,
        })
        .onConflictDoUpdate({
            target: messages.id,
            set: {
                content: body.content,
                thinking: body.thinking ?? null,
                model: body.model ?? null,
                toolCalls: body.toolCalls ?? null,
                error: body.error ?? null,
                steps: body.steps ?? null,
            },
        });

    return json({ ok: true });
};
