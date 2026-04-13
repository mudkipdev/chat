import { json } from "@sveltejs/kit";
import { deleteSession, clearSessionCookie } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

function parseCookies(header: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    for (const pair of header.split(";")) {
        const [key, ...rest] = pair.split("=");
        if (key) cookies[key.trim()] = rest.join("=").trim();
    }
    return cookies;
}

export const POST: RequestHandler = async ({ request }) => {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const cookies = parseCookies(cookieHeader);
    const token = cookies.session;

    if (token) await deleteSession(token);

    return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
};
