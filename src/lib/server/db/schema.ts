import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const conversations = sqliteTable("conversations", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text("title"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .notNull()
        .$defaultFn(() => new Date()),
});

export const messages = sqliteTable("messages", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
        .notNull()
        .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "tool"] }).notNull(),
    content: text("content").notNull(),
    thinking: text("thinking"),
    model: text("model"),
    toolCalls: text("tool_calls"),
    error: text("error"),
    steps: text("steps"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .notNull()
        .$defaultFn(() => new Date()),
});

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
