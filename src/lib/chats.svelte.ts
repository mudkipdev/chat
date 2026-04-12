import { chatStream, type ChatMessage } from "./ollama";
import { createPrompt } from "./prompt";

export type Message = ChatMessage & {
    id: string;
    model?: string | null;
    done?: boolean;
    error?: string;
    thinking?: string;
};

export type Chat = {
    id: string;
    messages: Message[];
};

export type RecentChat = {
    id: string;
    title: string | null;
    firstMessage: string;
    createdAt: number;
};

export const chats = $state<Record<string, Chat>>({});
export const chatError = $state({ message: "" });
export const recents = $state<{ items: RecentChat[]; loaded: boolean }>({
    items: [],
    loaded: false,
});

const activeStreams: Record<string, AbortController> = {};

function reportError(label: string, error: unknown): void {
    const detail = error instanceof Error ? error.message : String(error);
    chatError.message = `${label}: ${detail}`;
    console.error(label, error);
}

function persist(label: string, init: () => Promise<Response>): void {
    init()
        .then(async (response) => {
            if (!response.ok) {
                const text = await response.text().catch(() => "");
                reportError(label, `${response.status} ${text}`.trim());
            }
        })
        .catch((error) => reportError(label, error));
}

export function clearChatError(): void {
    chatError.message = "";
}

export function isStreaming(chatId: string): boolean {
    const chat = chats[chatId];
    if (!chat) return false;

    const last = chat.messages[chat.messages.length - 1];
    return last?.role === "assistant" && last.done === false;
}

export function stopStream(chatId: string): void {
    activeStreams[chatId]?.abort();
}

export function createChat(content: string, images?: string[]): string {
    const id = crypto.randomUUID();
    const messageId = crypto.randomUUID();

    chats[id] = {
        id,
        messages: [{ id: messageId, role: "user", content, images }],
    };

    recents.items = [
        { id, title: null, firstMessage: content, createdAt: Date.now() },
        ...recents.items,
    ];

    persist("save chat", () =>
        fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, messageId, content }),
        }),
    );

    return id;
}

export async function loadRecents(): Promise<void> {
    try {
        const response = await fetch("/api/chats");
        if (!response.ok) {
            reportError("load recents", `${response.status}`);
            return;
        }
        const data = (await response.json()) as RecentChat[];
        recents.items = data;
        recents.loaded = true;
    } catch (error) {
        reportError("load recents", error);
    }
}

export async function loadChat(chatId: string): Promise<Chat | null> {
    if (chats[chatId]) return chats[chatId];

    try {
        const response = await fetch(`/api/chats/${chatId}`);
        if (!response.ok) {
            if (response.status !== 404) {
                reportError("load chat", `${response.status}`);
            }
            return null;
        }

        const data = (await response.json()) as {
            id: string;
            messages: {
                id: string;
                role: "user" | "assistant";
                content: string;
                thinking: string | null;
                model: string | null;
            }[];
        };

        chats[data.id] = {
            id: data.id,
            messages: data.messages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                thinking: m.thinking ?? undefined,
                model: m.model,
                done: true,
            })),
        };
        return chats[data.id];
    } catch (error) {
        reportError("load chat", error);
        return null;
    }
}

export function appendUserMessage(
    chatId: string,
    content: string,
    images?: string[],
): void {
    const chat = chats[chatId];
    if (!chat) return;

    const messageId = crypto.randomUUID();
    chat.messages.push({ id: messageId, role: "user", content, images });

    persist("save message", () =>
        fetch(`/api/chats/${chatId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: messageId, role: "user", content }),
        }),
    );
}

export async function streamReply(
    chatId: string,
    model: string,
    think = false,
): Promise<void> {
    const chat = chats[chatId];
    if (!chat) return;

    const history: ChatMessage[] = [
        { role: "system", content: createPrompt() },
        ...chat.messages.map(({ role, content, images }) => {
            const msg: ChatMessage = { role, content };
            if (images && images.length > 0) msg.images = images;
            return msg;
        }),
    ];

    const messageId = crypto.randomUUID();
    chat.messages.push({ id: messageId, role: "assistant", content: "", done: false, model });
    const reply = chat.messages[chat.messages.length - 1];

    const controller = new AbortController();
    activeStreams[chatId] = controller;

    try {
        for await (const chunk of chatStream(model, history, {
            think,
            signal: controller.signal,
        })) {
            if (chunk.type === "thinking") {
                reply.thinking = (reply.thinking ?? "") + chunk.text;
            } else {
                reply.content += chunk.text;
            }
        }
    } catch (error) {
        if (!controller.signal.aborted) {
            const detail = error instanceof Error ? error.message : String(error);
            reply.error = detail;
        }
    } finally {
        reply.done = true;
        if (activeStreams[chatId] === controller) delete activeStreams[chatId];

        if (reply.content.length > 0) {
            persist("save reply", () =>
                fetch(`/api/chats/${chatId}/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: messageId,
                        role: "assistant",
                        content: reply.content,
                        thinking: reply.thinking ?? null,
                        model,
                    }),
                }),
            );
        }
    }
}

export function retryLast(
    chatId: string,
    model: string,
    think = false,
): Promise<void> | undefined {
    const chat = chats[chatId];
    if (!chat) return;

    const last = chat.messages[chat.messages.length - 1];
    if (last?.role === "assistant") {
        chat.messages.pop();
        persist("delete reply", () =>
            fetch(`/api/chats/${chatId}/messages/${last.id}`, { method: "DELETE" }),
        );
    }

    return streamReply(chatId, model, think);
}
