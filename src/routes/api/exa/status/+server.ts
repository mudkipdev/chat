import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    return json({ available: !!env.EXA_API_KEY });
};
