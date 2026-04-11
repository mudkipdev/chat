import { chatStream, type ChatMessage } from "./ollama";
import { createPrompt } from "./prompt";

export type Message = ChatMessage & { done?: boolean };

export type Chat = {
    id: string;
    messages: Message[];
};

export const chats = $state<Record<string, Chat>>({});

const activeStreams: Record<string, AbortController> = {};

export function isStreaming(chatId: string): boolean {
    const chat = chats[chatId];
    if (!chat) return false;

    const last = chat.messages[chat.messages.length - 1];
    return last?.role === "assistant" && last.done === false;
}

export function stopStream(chatId: string): void {
    activeStreams[chatId]?.abort();
}

export function createChat(content: string): string {
    const id = crypto.randomUUID();
    chats[id] = {
        id,
        messages: [{ role: "user", content }],
    };
    return id;
}

export function appendUserMessage(chatId: string, content: string): void {
    chats[chatId]?.messages.push({ role: "user", content });
}

export async function streamReply(chatId: string, model: string): Promise<void> {
    const chat = chats[chatId];
    if (!chat) return;

    const history: ChatMessage[] = [
        { role: "system", content: createPrompt() },
        ...chat.messages.map(({ role, content }) => ({ role, content })),
    ];

    chat.messages.push({ role: "assistant", content: "", done: false });
    const reply = chat.messages[chat.messages.length - 1];

    const controller = new AbortController();
    activeStreams[chatId] = controller;

    try {
        for await (const chunk of chatStream(model, history, controller.signal)) {
            reply.content += chunk;
        }
    } catch (error) {
        if (!controller.signal.aborted) {
            const message = error instanceof Error ? error.message : String(error);
            reply.content += `\n\n[error: ${message}]`;
        }
    } finally {
        reply.done = true;
        if (activeStreams[chatId] === controller) delete activeStreams[chatId];
    }
}

export function retryLast(chatId: string, model: string): Promise<void> | undefined {
    const chat = chats[chatId];
    if (!chat) return;

    const last = chat.messages[chat.messages.length - 1];
    if (last?.role === "assistant") chat.messages.pop();

    return streamReply(chatId, model);
}
