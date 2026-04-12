import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    const base = env.BASE_ENDPOINT?.replace(/\/$/, "") || "http://localhost:11434";
    const body = await request.json();
    if (!body.model || !body.messages) throw error(400, "model and messages required");

    // Try OpenAI-compatible endpoint first (works with both Ollama and llama.cpp),
    // fall back to Ollama's native endpoint
    let response = await fetch(`${base}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, stream: true }),
    });

    if (!response.ok) {
        response = await fetch(`${base}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, stream: true }),
        });
    }

    if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw error(response.status, text);
    }

    if (!response.body) {
        throw error(502, "No response body from backend");
    }

    return new Response(response.body, {
        headers: { "Content-Type": "text/event-stream" },
    });
};
