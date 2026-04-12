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

export type ToolCall = {
    function: {
        name: string;
        arguments: Record<string, unknown>;
    };
};

export type ChatMessage = {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    images?: string[];
    tool_calls?: ToolCall[];
};

export type ToolDefinition = {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
};

export const WEB_TOOLS: ToolDefinition[] = [
    {
        type: "function",
        function: {
            name: "web_search",
            description:
                "Search the web for current information. Use when you need up-to-date facts or information about recent events.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query",
                    },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "web_fetch",
            description:
                "Fetch and read the content of a specific web page. Use when you have a URL you want to read.",
            parameters: {
                type: "object",
                properties: {
                    url: {
                        type: "string",
                        description: "The URL to fetch",
                    },
                },
                required: ["url"],
            },
        },
    },
];

type TagsResponse = {
    models: OllamaModel[];
};

const PARAMETER_SUFFIX_MULTIPLIERS: Record<string, number> = {
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12,
};

export async function fetchModels(): Promise<OllamaModel[]> {
    const response = await fetch("/api/models");

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

export type StreamChunk =
    | { type: "content"; text: string }
    | { type: "thinking"; text: string }
    | { type: "tool_calls"; calls: ToolCall[] };

export async function* chatStream(
    model: string,
    messages: ChatMessage[],
    options: { think?: boolean; signal?: AbortSignal; tools?: ToolDefinition[] } = {},
): AsyncGenerator<StreamChunk> {
    const body: Record<string, unknown> = {
        model,
        messages,
        stream: true,
        think: options.think ?? false,
    };
    if (options.tools && options.tools.length > 0) {
        body.tools = options.tools;
    }

    const response = await fetch("/api/ollama/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: options.signal,
    });

    if (!response.ok || !response.body) {
        throw new Error(
            `ollama /api/chat: ${response.status} ${response.statusText}`,
        );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const collectedToolCalls: ToolCall[] = [];

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;

            // OpenAI SSE format: lines prefixed with "data: "
            const payload = trimmed.startsWith("data: ")
                ? trimmed.slice(6)
                : trimmed;

            const event = JSON.parse(payload);

            // OpenAI / llama.cpp format
            if (event.choices) {
                const choice = event.choices[0];
                const delta = choice?.delta ?? choice?.message;
                if (delta?.reasoning_content)
                    yield { type: "thinking", text: delta.reasoning_content as string };
                if (delta?.content)
                    yield { type: "content", text: delta.content as string };
                if (delta?.tool_calls) collectedToolCalls.push(...delta.tool_calls);
                if (choice?.finish_reason === "stop" || choice?.finish_reason === "tool_calls") {
                    if (collectedToolCalls.length > 0) {
                        yield { type: "tool_calls", calls: collectedToolCalls };
                    }
                    return;
                }
                continue;
            }

            // Ollama format
            const msg = event.message;
            if (msg?.thinking) yield { type: "thinking", text: msg.thinking as string };
            if (msg?.content) yield { type: "content", text: msg.content as string };
            if (msg?.tool_calls) collectedToolCalls.push(...msg.tool_calls);
            if (event.done) {
                if (collectedToolCalls.length > 0) {
                    yield { type: "tool_calls", calls: collectedToolCalls };
                }
                return;
            }
        }
    }
}
