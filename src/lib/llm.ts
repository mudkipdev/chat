export type Model = {
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
    type?: "function";
    id?: string;
    function: {
        name: string;
        arguments: Record<string, unknown> | string;
    };
};

export type ChatMessage = {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    images?: string[];
    tool_calls?: ToolCall[];
    tool_call_id?: string;
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

export const SANDBOX_TOOLS: ToolDefinition[] = [
    {
        type: "function",
        function: {
            name: "container.run_command",
            description: "Run a shell command in a sandboxed Linux container. Use for executing code, installing packages, or running scripts.",
            parameters: {
                type: "object",
                properties: {
                    command: {
                        type: "string",
                        description: "The shell command to execute",
                    },
                },
                required: ["command"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "container.read_file",
            description: "Read the contents of a file in the sandbox container.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Absolute path to the file to read",
                    },
                },
                required: ["path"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "container.write_file",
            description:
                "Write content to a file in the sandbox container. Creates the file and any parent directories if they don't exist.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Absolute path to the file to write",
                    },
                    content: {
                        type: "string",
                        description: "The content to write to the file",
                    },
                },
                required: ["path", "content"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "container.edit_file",
            description:
                "Edit a file by replacing an exact string match with new content.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Absolute path to the file to edit",
                    },
                    old_string: {
                        type: "string",
                        description: "The exact string to find and replace",
                    },
                    new_string: {
                        type: "string",
                        description: "The replacement string",
                    },
                },
                required: ["path", "old_string", "new_string"],
            },
        },
    },
];

type ModelsResponse = {
    models: Model[];
};

const PARAMETER_SUFFIX_MULTIPLIERS: Record<string, number> = {
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12,
};

export async function fetchModels(): Promise<Model[]> {
    const response = await fetch("/api/models");

    if (!response.ok) {
        throw new Error(
            `Failed to fetch models: ${response.status} ${response.statusText}`,
        );
    }

    const data: ModelsResponse = await response.json();
    return data.models;
}

export function parameterCount(model: Model): number {
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
    const think = options.think ?? false;
    const body: Record<string, unknown> = {
        model,
        messages,
        stream: true,
        // Ollama
        think,
        // llama.cpp
        chat_template_kwargs: { enable_thinking: think },
    };
    if (options.tools && options.tools.length > 0) {
        body.tools = options.tools;
    }

    const response = await fetch("/api/llm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: options.signal,
    });

    if (!response.ok || !response.body) {
        const detail = await response.text().catch(() => response.statusText);
        throw new Error(`Chat request failed: ${detail}`);
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
                if (delta?.tool_calls) {
                    for (const tc of delta.tool_calls) {
                        const idx = tc.index ?? collectedToolCalls.length;
                        if (!collectedToolCalls[idx]) {
                            // First chunk for this tool call — has id, name, and start of args
                            collectedToolCalls[idx] = {
                                type: "function",
                                id: tc.id,
                                function: {
                                    name: tc.function?.name ?? "",
                                    arguments: tc.function?.arguments ?? "",
                                },
                            };
                        } else {
                            // Subsequent chunks — append to arguments
                            collectedToolCalls[idx].function.arguments +=
                                tc.function?.arguments ?? "";
                        }
                    }
                }
                if (choice?.finish_reason === "stop" || choice?.finish_reason === "tool_calls") {
                    if (collectedToolCalls.length > 0) {
                        // Parse the accumulated argument strings into objects
                        const parsed = collectedToolCalls.map((tc) => ({
                            ...tc,
                            function: {
                                name: tc.function.name,
                                arguments:
                                    typeof tc.function.arguments === "string"
                                        ? JSON.parse(tc.function.arguments)
                                        : tc.function.arguments,
                            },
                        }));
                        yield { type: "tool_calls", calls: parsed };
                    }
                    return;
                }
                continue;
            }

            // Ollama format
            const msg = event.message;
            if (msg?.thinking) yield { type: "thinking", text: msg.thinking as string };
            if (msg?.content) yield { type: "content", text: msg.content as string };
            if (msg?.tool_calls) {
                for (const tc of msg.tool_calls) {
                    collectedToolCalls.push({ type: "function", ...tc });
                }
            }
            if (event.done) {
                if (collectedToolCalls.length > 0) {
                    yield { type: "tool_calls", calls: collectedToolCalls };
                }
                return;
            }
        }
    }
}
