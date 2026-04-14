import { error } from "@sveltejs/kit";
import { getSandbox, sandboxReadFile } from "$lib/server/sandbox";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
    const sandboxId = url.searchParams.get("sandbox");
    const path = url.searchParams.get("path");

    if (!sandboxId || !path) throw error(400, "sandbox and path required");

    const sandbox = getSandbox(sandboxId);
    if (!sandbox) throw error(404, "sandbox not found");

    try {
        const content = await sandboxReadFile(sandbox, path);
        const filename = path.split("/").pop() ?? "file";
        return new Response(content, {
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch {
        throw error(404, "file not found");
    }
};
