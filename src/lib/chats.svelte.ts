import { chatStream, type ChatMessage } from "./ollama";
import { createPrompt } from "./prompt";

export type Message = ChatMessage & { done?: boolean };

export type Chat = {
    id: string;
    messages: Message[];
};

export const chats = $state<Record<string, Chat>>({});

export function createChat(content: string): string {
    const id = crypto.randomUUID();
    chats[id] = {
        id,
        messages: [{ role: "user", content }],
    };
    return id;
}

export function appendUserMessage(chatId: string, content: string) {
    const chat = chats[chatId];
    if (!chat) return;
    chat.messages.push({ role: "user", content });
}

export async function streamReply(chatId: string, model: string) {
    const chat = chats[chatId];
    if (!chat) return;
    const history: ChatMessage[] = [
        { role: "system", content: createPrompt() },
        ...chat.messages.map(({ role, content }) => ({ role, content })),
    ];
    chat.messages.push({ role: "assistant", content: "", done: false });
    const assistant = chat.messages[chat.messages.length - 1];
    try {
        for await (const chunk of chatStream(model, history)) {
            assistant.content += chunk;
        }
    } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        assistant.content += `\n\n[error: ${err}]`;
    } finally {
        assistant.done = true;
    }
}

export function retryLast(chatId: string, model: string) {
    const chat = chats[chatId];
    if (!chat) return;
    if (chat.messages[chat.messages.length - 1]?.role === "assistant") {
        chat.messages.pop();
    }
    return streamReply(chatId, model);
}
