import type { ToolCall } from "./llm";

export type Step =
    | { type: "thinking"; text: string }
    | { type: "search"; query: string }
    | { type: "fetch"; url: string };

export type UserMeta = {
    images?: string[];
};

export type AssistantMeta = {
    model?: string;
    thinking?: string;
    toolCalls?: ToolCall[];
    error?: string;
    steps?: Step[];
};

export type ToolMeta = {
    toolCallId?: string;
};

export type MessageMeta = UserMeta | AssistantMeta | ToolMeta;
