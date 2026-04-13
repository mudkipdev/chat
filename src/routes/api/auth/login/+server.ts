import { json, error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db, users } from "$lib/server/db";
import { verifyPassword, createSession, sessionCookie } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    const { username, password } = (await request.json()) as {
        username?: string;
        password?: string;
    };

    if (!username || !password) {
        throw error(400, "username, password required");
    }

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw error(401, "invalid username or password");
    }

    const token = await createSession(user.id);

    return json(
        { id: user.id, username: user.username, displayName: user.displayName, admin: user.admin },
        { headers: { "Set-Cookie": sessionCookie(token) } },
    );
};
