import { env } from "$env/dynamic/private";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    const base = env.BASE_ENDPOINT?.replace(/\/$/, "") || "http://localhost:11434";
    const response = await fetch(`${base}/api/tags`);

    if (!response.ok) {
        return new Response(response.statusText, { status: response.status });
    }

    const data = await response.json();

    // Ollama format: { models: [...] }
    if (data.models) {
        return Response.json(data);
    }

    // OpenAI / llama.cpp format: { data: [...] }
    if (data.data) {
        const models = data.data.map((m: Record<string, unknown>) => {
            const id = m.id as string;
            // Try to extract parameter size from id (e.g. "qwen3.5:35b" → "35B")
            const sizeMatch = id.match(/:(\d+(?:\.\d+)?)(b|m|k)/i);
            const parameterSize = sizeMatch
                ? `${sizeMatch[1]}${sizeMatch[2].toUpperCase()}`
                : "";

            return {
                name: id,
                model: id,
                modified_at: new Date((m.created as number) * 1000).toISOString(),
                size: 0,
                digest: id,
                details: {
                    format: "gguf",
                    family: id.split(/[:/]/)[0],
                    families: null,
                    parameter_size: parameterSize,
                    quantization_level: "",
                },
            };
        });

        return Response.json({ models });
    }

    return Response.json({ models: [] });
};
