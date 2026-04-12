import { json } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { db, messages } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const DELETE: RequestHandler = async ({ params }) => {
    await db
        .delete(messages)
        .where(
            and(
                eq(messages.id, params.mid),
                eq(messages.conversationId, params.id),
            ),
        );
    return json({ ok: true });
};
