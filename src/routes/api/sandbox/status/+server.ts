import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    try {
        const proc = Bun.spawn(["which", "nsjail"], {
            stdout: "pipe",
            stderr: "pipe",
        });
        const code = await proc.exited;
        return json({ available: code === 0 });
    } catch {
        return json({ available: false });
    }
};
