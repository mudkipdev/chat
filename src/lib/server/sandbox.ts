import { mkdtemp, rm, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const NSJAIL_PATH = process.env.NSJAIL_PATH ?? "nsjail";
const COMMAND_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 64 * 1024;

export type Sandbox = {
    id: string;
    workDir: string;
};

const sandboxes = new Map<string, Sandbox>();

export async function createSandbox(): Promise<Sandbox> {
    const workDir = await mkdtemp(join(tmpdir(), "sandbox-"));
    await mkdir(join(workDir, "home/user"), { recursive: true });
    await mkdir(join(workDir, "tmp"), { recursive: true });
    await mkdir(join(workDir, "empty"), { recursive: true });

    const id = crypto.randomUUID();
    const sandbox: Sandbox = { id, workDir };
    sandboxes.set(id, sandbox);
    return sandbox;
}

export function getSandbox(id: string): Sandbox | undefined {
    return sandboxes.get(id);
}

export async function destroySandbox(id: string): Promise<void> {
    const sandbox = sandboxes.get(id);
    if (!sandbox) return;
    await rm(sandbox.workDir, { recursive: true, force: true });
    sandboxes.delete(id);
}

export async function runCommand(
    sandbox: Sandbox,
    command: string,
): Promise<{ exitCode: number; output: string }> {
    // Mount system dirs read-only, writable dirs from sandbox workDir.
    // No --chroot: we construct the filesystem explicitly so nothing is writable
    // except /home/user and /tmp, and /app is never mounted.
    const homeDir = join(sandbox.workDir, "home/user");
    const tmpDir = join(sandbox.workDir, "tmp");

    const args = [
        NSJAIL_PATH,
        "--mode", "o",
        "--chroot", "/",
        "--cwd", "/home/user",
        "--time_limit", String(Math.ceil(COMMAND_TIMEOUT_MS / 1000)),
        "--rlimit_as", "1024",
        "--rlimit_cpu", "30",
        "--rlimit_fsize", "128",
        "--rlimit_nofile", "256",
        // Disable namespace features that break inside Docker
        "--disable_clone_newpid",
        "--disable_clone_newcgroup",
        "--disable_clone_newnet",
        "--disable_clone_newuser",
        // Don't try to mount a fresh procfs (Docker blocks it)
        "--proc_path", "",
        // Hide the app directory
        "--bindmount_ro", `${join(sandbox.workDir, "empty")}:/app`,
        // Writable ephemeral directories
        "--bindmount", `${homeDir}:/home/user`,
        "--bindmount", `${tmpDir}:/tmp`,
        // Environment
        "--env", "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "--env", "HOME=/home/user",
        "--env", "TMPDIR=/tmp",
        "--env", "LANG=C.UTF-8",
        "--env", "PYTHONDONTWRITEBYTECODE=1",
        "--", "/bin/sh", "-c", command,
    ];

    const proc = Bun.spawn(args, {
        stdout: "pipe",
        stderr: "pipe",
    });

    const timeout = setTimeout(() => proc.kill(), COMMAND_TIMEOUT_MS);

    const [stdoutBuf, stderrBuf] = await Promise.all([
        new Response(proc.stdout).arrayBuffer(),
        new Response(proc.stderr).arrayBuffer(),
    ]);

    clearTimeout(timeout);

    const exitCode = await proc.exited;
    const decoder = new TextDecoder();
    let output = decoder.decode(stdoutBuf);
    const errOut = decoder.decode(stderrBuf);

    if (errOut.length > 0) {
        // Always log full stderr to container logs for debugging
        if (exitCode !== 0) {
            console.error(`[sandbox] command failed (exit ${exitCode}): ${command}\n${errOut}`);
        }

        // On failure, include all stderr. On success, filter nsjail log lines.
        const filtered = exitCode === 0
            ? errOut.split("\n").filter((l) => !l.match(/^\[.+\] /)).join("\n").trim()
            : errOut.trim();
        if (filtered.length > 0) {
            output += (output.length > 0 ? "\n" : "") + filtered;
        }
    }

    if (output.length > MAX_OUTPUT_BYTES) {
        output = output.slice(0, MAX_OUTPUT_BYTES) + "\n... (output truncated)";
    }

    return { exitCode, output };
}

export async function sandboxReadFile(
    sandbox: Sandbox,
    path: string,
): Promise<string> {
    const resolved = join(sandbox.workDir, path);
    if (!resolved.startsWith(sandbox.workDir)) {
        throw new Error("path traversal not allowed");
    }
    return readFile(resolved, "utf-8");
}

export async function sandboxWriteFile(
    sandbox: Sandbox,
    path: string,
    content: string,
): Promise<void> {
    const resolved = join(sandbox.workDir, path);
    if (!resolved.startsWith(sandbox.workDir)) {
        throw new Error("path traversal not allowed");
    }
    const dir = resolved.slice(0, resolved.lastIndexOf("/"));
    await mkdir(dir, { recursive: true });
    await writeFile(resolved, content, "utf-8");
}

export async function sandboxEditFile(
    sandbox: Sandbox,
    path: string,
    oldString: string,
    newString: string,
): Promise<void> {
    const current = await sandboxReadFile(sandbox, path);
    if (!current.includes(oldString)) {
        throw new Error("old_string not found in file");
    }
    const updated = current.replace(oldString, newString);
    await sandboxWriteFile(sandbox, path, updated);
}
