<script lang="ts">
    import { goto } from "$app/navigation";
    import { loadUser } from "$lib/state.svelte";

    let username = $state("");
    let password = $state("");
    let error = $state("");
    let loading = $state(false);

    async function submit(e: SubmitEvent) {
        e.preventDefault();
        error = "";
        loading = true;

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                error = data.message ?? `Login failed (${res.status})`;
                return;
            }

            await loadUser();
            goto("/");
        } catch {
            error = "Something went wrong";
        } finally {
            loading = false;
        }
    }
</script>

<div class="flex min-h-screen items-center justify-center bg-bg-100 px-6">
    <div class="w-full max-w-sm">
        <h1 class="mb-8 text-center font-serif text-3xl font-light text-text-100">Sign in</h1>

        <form onsubmit={submit} class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
                <label for="username" class="text-sm text-text-300">Username</label>
                <input
                    id="username"
                    type="text"
                    autocomplete="username"
                    bind:value={username}
                    required
                    class="rounded-lg border border-border-300/15 bg-bg-200 px-3 py-2 text-sm text-text-100 outline-none transition-colors focus:border-accent-100"
                />
            </div>

            <div class="flex flex-col gap-1.5">
                <label for="password" class="text-sm text-text-300">Password</label>
                <input
                    id="password"
                    type="password"
                    autocomplete="current-password"
                    bind:value={password}
                    required
                    class="rounded-lg border border-border-300/15 bg-bg-200 px-3 py-2 text-sm text-text-100 outline-none transition-colors focus:border-accent-100"
                />
            </div>

            {#if error}
                <div class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                </div>
            {/if}

            <button
                type="submit"
                disabled={loading}
                class="mt-2 cursor-pointer rounded-lg bg-accent-100 px-4 py-2 text-sm font-medium text-oncolor-100 transition-colors hover:bg-accent-200 disabled:opacity-50"
            >
                {loading ? "Signing in..." : "Sign in"}
            </button>
        </form>

    </div>
</div>
