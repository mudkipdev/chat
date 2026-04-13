import { json, error } from "@sveltejs/kit";
import { db, users } from "$lib/server/db";
import { hashPassword } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.user?.admin) throw error(403, "forbidden");

    const rows = await db
        .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            admin: users.admin,
            createdAt: users.createdAt,
        })
        .from(users);

    return json(rows);
};

export const POST: RequestHandler = async ({ locals, request }) => {
    if (!locals.user?.admin) throw error(403, "forbidden");

    const { username, displayName, password } = (await request.json()) as {
        username?: string;
        displayName?: string;
        password?: string;
    };

    if (!username || !password) {
        throw error(400, "username and password required");
    }

    if (username.length < 1 || username.length > 24 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        throw error(400, "username must be 1-24 alphanumeric characters or underscores");
    }

    if (password.length < 8) {
        throw error(400, "password must be at least 8 characters");
    }

    const passwordHash = await hashPassword(password);

    try {
        const [user] = await db
            .insert(users)
            .values({
                username,
                displayName: (displayName?.trim() || username),
                passwordHash,
            })
            .returning({
                id: users.id,
                username: users.username,
                displayName: users.displayName,
                admin: users.admin,
                createdAt: users.createdAt,
            });

        return json(user, { status: 201 });
    } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("UNIQUE")) {
            throw error(409, "username already taken");
        }
        throw e;
    }
};
