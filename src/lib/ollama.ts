export type OllamaModel = {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
        parent_model?: string;
        format: string;
        family: string;
        families: string[] | null;
        parameter_size: string;
        quantization_level: string;
    };
};

type OllamaTagsResponse = {
    models: OllamaModel[];
};

const BASE_URL = "http://localhost:11434";

export async function fetchModels(): Promise<OllamaModel[]> {
    const res = await fetch(`${BASE_URL}/api/tags`);
    if (!res.ok) {
        throw new Error(`ollama /api/tags: ${res.status} ${res.statusText}`);
    }
    const data: OllamaTagsResponse = await res.json();
    return data.models;
}

const SUFFIX_MULTIPLIERS: Record<string, number> = {
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12,
};

export function parameterCount(model: OllamaModel): number {
    const raw = model.details.parameter_size;
    if (!raw) return 0;
    const match = raw.match(/^([\d.]+)\s*([KMBT])?/i);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const suffix = (match[2] ?? "").toUpperCase();
    return num * (SUFFIX_MULTIPLIERS[suffix] ?? 1);
}

export type ChatMessage = {
    role: "user" | "assistant" | "system";
    content: string;
};

export async function* chatStream(
    model: string,
    messages: ChatMessage[],
): AsyncGenerator<string> {
    const res = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true }),
    });
    if (!res.ok || !res.body) {
        throw new Error(`ollama /api/chat: ${res.status} ${res.statusText}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
            if (!line.trim()) continue;
            const data = JSON.parse(line);
            if (data.message?.content) yield data.message.content as string;
            if (data.done) return;
        }
    }
}