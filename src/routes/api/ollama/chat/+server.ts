import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    const base = env.BASE_ENDPOINT?.replace(/\/$/, "") || "http://localhost:11434";
    const body = await request.json();
    if (!body.model || !body.messages) throw error(400, "model and messages required");

    const response = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, stream: true }),
    });

    if (!response.ok || !response.body) {
        return new Response(response.statusText, { status: response.status });
    }

    return new Response(response.body, {
        headers: { "Content-Type": "application/x-ndjson" },
    });
};
