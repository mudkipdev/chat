import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import Exa from "exa-js";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    const apiKey = env.EXA_API_KEY;
    if (!apiKey) throw error(503, "Exa API key not configured");

    const { query } = (await request.json()) as { query?: string };
    if (!query?.trim()) throw error(400, "query required");

    const exa = new Exa(apiKey);
    const result = await exa.search(query, {
        numResults: 5,
        type: "auto",
    });

    const formatted = result.results
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}`)
        .join("\n\n");

    return new Response(formatted, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};
