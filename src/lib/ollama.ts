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

export type ChatMessage = {
    role: "user" | "assistant" | "system";
    content: string;
};

type TagsResponse = {
    models: OllamaModel[];
};

const OLLAMA_BASE_URL = "http://localhost:11434";

const PARAMETER_SUFFIX_MULTIPLIERS: Record<string, number> = {
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12,
};

export async function fetchModels(): Promise<OllamaModel[]> {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (!response.ok) {
        throw new Error(
            `ollama /api/tags: ${response.status} ${response.statusText}`,
        );
    }

    const data: TagsResponse = await response.json();
    return data.models;
}

export function parameterCount(model: OllamaModel): number {
    const raw = model.details.parameter_size;
    if (!raw) return 0;

    const match = raw.match(/^([\d.]+)\s*([KMBT])?/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const suffix = (match[2] ?? "").toUpperCase();
    return value * (PARAMETER_SUFFIX_MULTIPLIERS[suffix] ?? 1);
}

export async function* chatStream(
    model: string,
    messages: ChatMessage[],
    signal?: AbortSignal,
): AsyncGenerator<string> {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true }),
        signal,
    });

    if (!response.ok || !response.body) {
        throw new Error(
            `ollama /api/chat: ${response.status} ${response.statusText}`,
        );
    }

    const reader = response.body.getReader();
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

            const event = JSON.parse(line);
            if (event.message?.content) yield event.message.content as string;
            if (event.done) return;
        }
    }
}
