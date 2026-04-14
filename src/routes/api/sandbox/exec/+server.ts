import { json, error } from "@sveltejs/kit";
import {
    createSandbox,
    getSandbox,
    destroySandbox,
    runCommand,
    sandboxReadFile,
    sandboxWriteFile,
    sandboxEditFile,
} from "$lib/server/sandbox";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    const body = (await request.json()) as {
        sandboxId?: string;
        tool: string;
        args: Record<string, unknown>;
    };

    if (!body.tool) throw error(400, "tool required");

    // Lazily create sandbox on first use
    let sandboxId = body.sandboxId;
    let sandbox = sandboxId ? getSandbox(sandboxId) : undefined;
    if (!sandbox) {
        sandbox = await createSandbox();
        sandboxId = sandbox.id;
    }

    try {
        if (body.tool === "container.run_command") {
            const command = body.args.command as string;
            if (!command) throw error(400, "command required");

            const result = await runCommand(sandbox, command);
            return json({
                sandboxId,
                output: result.output,
                exitCode: result.exitCode,
            });
        }

        if (body.tool === "container.read_file") {
            const path = body.args.path as string;
            if (!path) throw error(400, "path required");

            const content = await sandboxReadFile(sandbox, path);
            return json({ sandboxId, output: content });
        }

        if (body.tool === "container.write_file") {
            const path = body.args.path as string;
            const content = body.args.content as string;
            if (!path || content == null) throw error(400, "path and content required");

            await sandboxWriteFile(sandbox, path, content);
            return json({ sandboxId, output: `Wrote ${path}` });
        }

        if (body.tool === "container.edit_file") {
            const path = body.args.path as string;
            const oldString = body.args.old_string as string;
            const newString = body.args.new_string as string;
            if (!path || oldString == null || newString == null) {
                throw error(400, "path, old_string, new_string required");
            }

            await sandboxEditFile(sandbox, path, oldString, newString);
            return json({ sandboxId, output: `Edited ${path}` });
        }

        throw error(400, `unknown tool: ${body.tool}`);
    } catch (e: unknown) {
        if (e && typeof e === "object" && "status" in e) throw e;
        const detail = e instanceof Error ? e.message : String(e);
        return json({ sandboxId, output: `Error: ${detail}` }, { status: 200 });
    }
};

export const DELETE: RequestHandler = async ({ request }) => {
    const { sandboxId } = (await request.json()) as { sandboxId?: string };
    if (sandboxId) await destroySandbox(sandboxId);
    return json({ ok: true });
};
