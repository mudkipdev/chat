import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const sqlite = new Database("local.db");
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });
export * from "./schema";

async function bootstrapAdmin() {
    const username = process.env.ADMIN_ACCOUNT_USERNAME;
    const password = process.env.ADMIN_ACCOUNT_PASSWORD;

    if (!username || !password) return;

    const passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });

    const existing = await db
        .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
        .from(schema.users)
        .where(eq(schema.users.username, username))
        .limit(1);

    if (existing.length > 0) {
        const match = await Bun.password.verify(password, existing[0].passwordHash);
        if (!match) {
            await db
                .update(schema.users)
                .set({ passwordHash, admin: true })
                .where(eq(schema.users.id, existing[0].id));
            console.log(`Admin account "${username}" password updated`);
        }
        return;
    }

    await db.insert(schema.users).values({
        username,
        displayName: username,
        passwordHash,
        admin: true,
    });

    console.log(`Admin account "${username}" created`);
}

bootstrapAdmin();
