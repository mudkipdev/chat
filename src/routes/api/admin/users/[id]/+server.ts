import { json, error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db, users } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const DELETE: RequestHandler = async ({ locals, params }) => {
    if (!locals.user?.admin) throw error(403, "forbidden");
    if (params.id === locals.user.id) throw error(400, "cannot delete yourself");

    await db.delete(users).where(eq(users.id, params.id));
    return json({ ok: true });
};
