import { redirect, type Handle } from "@sveltejs/kit";
import { validateSession } from "$lib/server/auth";

function parseCookies(header: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    for (const pair of header.split(";")) {
        const [key, ...rest] = pair.split("=");
        if (key) cookies[key.trim()] = rest.join("=").trim();
    }
    return cookies;
}

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export const handle: Handle = async ({ event, resolve }) => {
    const cookieHeader = event.request.headers.get("cookie") ?? "";
    const cookies = parseCookies(cookieHeader);
    const token = cookies.session;

    event.locals.user = token ? await validateSession(token) : null;

    const { pathname } = event.url;
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

    if (!event.locals.user && !isPublic) {
        if (pathname.startsWith("/api/")) {
            return new Response(JSON.stringify({ error: "unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }
        throw redirect(302, "/login");
    }

    return resolve(event);
};
