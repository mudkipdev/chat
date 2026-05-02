import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import Exa from "exa-js";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    const apiKey = env.EXA_API_KEY;
    if (!apiKey) throw error(503, "Exa API key not configured");

    const { url } = (await request.json()) as { url?: string };
    if (!url?.trim()) throw error(400, "url required");

    const exa = new Exa(apiKey);
    const result = await exa.getContents([url], {
        text: { maxCharacters: 5000 },
        livecrawl: "fallback",
        livecrawlTimeout: 5000,
    });

    const page = result.results[0];
    if (!page) return new Response("No content found for this URL.");

    return new Response(`${page.title}\n${page.url}\n\n${page.text}`, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};
