import { eq, and, gt } from "drizzle-orm";
import { db, users, sessions } from "./db";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SessionUser = {
    id: string;
    username: string;
    displayName: string;
    admin: boolean;
};

export async function hashPassword(password: string): Promise<string> {
    return Bun.password.hash(password, { algorithm: "argon2id" });
}

export async function verifyPassword(
    password: string,
    hash: string,
): Promise<boolean> {
    return Bun.password.verify(password, hash);
}

export async function createSession(userId: string): Promise<string> {
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.insert(sessions).values({ id, userId, expiresAt });
    return id;
}

export async function validateSession(
    token: string,
): Promise<SessionUser | null> {
    const row = await db
        .select({
            userId: users.id,
            username: users.username,
            displayName: users.displayName,
            admin: users.admin,
            expiresAt: sessions.expiresAt,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(
            and(
                eq(sessions.id, token),
                gt(sessions.expiresAt, new Date()),
            ),
        )
        .limit(1);

    if (row.length === 0) return null;

    return {
        id: row[0].userId,
        username: row[0].username,
        displayName: row[0].displayName,
        admin: row[0].admin,
    };
}

export async function deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, token));
}

export function sessionCookie(
    token: string,
    maxAge = SESSION_DURATION_MS / 1000,
): string {
    return `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(maxAge)}`;
}

export function clearSessionCookie(): string {
    return "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";
}
