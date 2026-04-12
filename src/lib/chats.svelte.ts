import { chatStream, WEB_TOOLS, type ChatMessage, type ToolCall } from "./ollama";
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
                role: "user" | "assistant" | "tool";
                content: string;
                thinking: string | null;
                model: string | null;
                toolCalls: string | null;
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
                tool_calls: m.toolCalls ? JSON.parse(m.toolCalls) : undefined,
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

async function executeToolCall(call: ToolCall): Promise<string> {
    const { name, arguments: args } = call.function;

    try {
        if (name === "web_search") {
            const res = await fetch("/api/exa/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: args.query }),
            });
            if (!res.ok) return `Search failed: ${res.status}`;
            return await res.text();
        }

        if (name === "web_fetch") {
            const res = await fetch("/api/exa/contents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: args.url }),
            });
            if (!res.ok) return `Fetch failed: ${res.status}`;
            return await res.text();
        }
    } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        return `Tool error: ${detail}`;
    }

    return `Unknown tool: ${name}`;
}

function buildHistory(msgs: Message[]): ChatMessage[] {
    return [
        { role: "system", content: createPrompt() },
        ...msgs.map(({ role, content, images, tool_calls }) => {
            const msg: ChatMessage = { role, content };
            if (images && images.length > 0) msg.images = images;
            if (tool_calls && tool_calls.length > 0) msg.tool_calls = tool_calls;
            return msg;
        }),
    ];
}

export async function streamReply(
    chatId: string,
    model: string,
    think = false,
    webBrowsing = false,
): Promise<void> {
    const chat = chats[chatId];
    if (!chat) return;

    const controller = new AbortController();
    activeStreams[chatId] = controller;

    const tools = webBrowsing ? WEB_TOOLS : undefined;
    const MAX_TOOL_ROUNDS = 5;

    let replyId = crypto.randomUUID();
    chat.messages.push({ id: replyId, role: "assistant", content: "", done: false, model });
    let reply = chat.messages[chat.messages.length - 1];

    try {
        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
            // Build history from all messages EXCEPT the current in-progress reply
            const settled = chat.messages.slice(0, -1);
            const history = buildHistory(settled);

            let toolCalls: ToolCall[] | undefined;

            for await (const chunk of chatStream(model, history, {
                think,
                signal: controller.signal,
                tools,
            })) {
                if (chunk.type === "thinking") {
                    reply.thinking = (reply.thinking ?? "") + chunk.text;
                } else if (chunk.type === "content") {
                    reply.content += chunk.text;
                } else if (chunk.type === "tool_calls") {
                    toolCalls = chunk.calls;
                }
            }

            if (!toolCalls || toolCalls.length === 0 || round === MAX_TOOL_ROUNDS) break;

            // Finalize the current reply as a tool-calling message
            reply.tool_calls = toolCalls;
            reply.done = true;

            persist("save tool call", () =>
                fetch(`/api/chats/${chatId}/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: replyId,
                        role: "assistant",
                        content: reply.content,
                        thinking: reply.thinking ?? null,
                        model,
                        toolCalls: JSON.stringify(toolCalls),
                    }),
                }),
            );

            // Execute each tool call and persist the result as a message
            for (const call of toolCalls) {
                const result = await executeToolCall(call);
                const toolMsgId = crypto.randomUUID();
                chat.messages.push({
                    id: toolMsgId,
                    role: "tool",
                    content: result,
                    done: true,
                });

                persist("save tool result", () =>
                    fetch(`/api/chats/${chatId}/messages`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: toolMsgId,
                            role: "tool",
                            content: result,
                        }),
                    }),
                );
            }

            // Create a fresh reply for the next round
            replyId = crypto.randomUUID();
            chat.messages.push({
                id: replyId,
                role: "assistant",
                content: "",
                done: false,
                model,
            });
            reply = chat.messages[chat.messages.length - 1];
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
                        id: replyId,
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
    webBrowsing = false,
): Promise<void> | undefined {
    const chat = chats[chatId];
    if (!chat) return;

    // Remove all messages after the last user message (tool calls, results, assistant replies)
    while (chat.messages.length > 0) {
        const last = chat.messages[chat.messages.length - 1];
        if (last.role === "user") break;
        chat.messages.pop();
        persist("delete message", () =>
            fetch(`/api/chats/${chatId}/messages/${last.id}`, { method: "DELETE" }),
        );
    }

    return streamReply(chatId, model, think, webBrowsing);
}
