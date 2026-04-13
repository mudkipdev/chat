<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { Icon, Trash } from "@xylightdev/svelte-hero-icons";
    import { user } from "$lib/state.svelte";

    type UserRow = {
        id: string;
        username: string;
        displayName: string;
        admin: boolean;
        createdAt: Date;
    };

    let users = $state<UserRow[]>([]);
    let username = $state("");
    let displayName = $state("");
    let password = $state("");
    let error = $state("");
    let success = $state("");
    let loading = $state(false);

    async function loadUsers() {
        const res = await fetch("/api/admin/users");
        if (res.ok) users = await res.json();
    }

    async function createUser(e: SubmitEvent) {
        e.preventDefault();
        error = "";
        success = "";
        loading = true;

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    displayName: displayName || username,
                    password,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                error = data.message ?? `Failed (${res.status})`;
                return;
            }

            success = `User "${username}" created`;
            username = "";
            displayName = "";
            password = "";
            await loadUsers();
        } catch {
            error = "Something went wrong";
        } finally {
            loading = false;
        }
    }

    async function deleteUser(id: string, name: string) {
        if (!confirm(`Delete user "${name}"? Their conversations will also be deleted.`)) return;

        const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        if (res.ok) {
            await loadUsers();
        }
    }

    onMount(() => {
        if (user.loaded && !user.info?.admin) {
            goto("/");
            return;
        }
        loadUsers();
    });
</script>

<div class="flex h-screen flex-col overflow-y-auto">
    <div class="mx-auto w-full max-w-2xl px-6 py-10">
        <h1 class="mb-8 font-serif text-3xl font-light text-text-100">Manage users</h1>

        <form onsubmit={createUser} class="mb-10 rounded-lg border border-border-300/15 bg-bg-200 p-5">
            <h2 class="mb-4 text-sm font-medium text-text-200">Create new user</h2>

            <div class="flex flex-col gap-3">
                <div class="flex gap-3">
                    <div class="flex flex-1 flex-col gap-1.5">
                        <label for="username" class="text-xs text-text-400">Username</label>
                        <input
                            id="username"
                            type="text"
                            bind:value={username}
                            required
                            minlength={3}
                            maxlength={32}
                            pattern="[a-zA-Z0-9_]+"
                            class="rounded-md border border-border-300/15 bg-bg-100 px-3 py-1.5 text-sm text-text-100 outline-none transition-colors focus:border-accent-100"
                        />
                    </div>
                    <div class="flex flex-1 flex-col gap-1.5">
                        <label for="displayName" class="text-xs text-text-400">Display name</label>
                        <input
                            id="displayName"
                            type="text"
                            bind:value={displayName}
                            placeholder={username || "Optional"}
                            class="rounded-md border border-border-300/15 bg-bg-100 px-3 py-1.5 text-sm text-text-100 outline-none transition-colors focus:border-accent-100"
                        />
                    </div>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label for="password" class="text-xs text-text-400">Password</label>
                    <input
                        id="password"
                        type="password"
                        autocomplete="new-password"
                        bind:value={password}
                        required
                        minlength={8}
                        class="rounded-md border border-border-300/15 bg-bg-100 px-3 py-1.5 text-sm text-text-100 outline-none transition-colors focus:border-accent-100"
                    />
                </div>

                {#if error}
                    <div class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                        {error}
                    </div>
                {/if}

                {#if success}
                    <div class="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
                        {success}
                    </div>
                {/if}

                <button
                    type="submit"
                    disabled={loading}
                    class="mt-1 w-fit cursor-pointer rounded-md bg-accent-100 px-4 py-1.5 text-sm font-medium text-oncolor-100 transition-colors hover:bg-accent-200 disabled:opacity-50"
                >
                    {loading ? "Creating..." : "Create user"}
                </button>
            </div>
        </form>

        <div>
            <h2 class="mb-3 text-sm font-medium text-text-200">All users</h2>
            <div class="rounded-lg border border-border-300/15 divide-y divide-border-300/15">
                {#each users as u (u.id)}
                    <div class="flex items-center justify-between px-4 py-3">
                        <div>
                            <span class="text-sm text-text-100">{u.displayName}</span>
                            <span class="ml-2 text-xs text-text-400">@{u.username}</span>
                            {#if u.admin}
                                <span class="ml-2 rounded-full bg-accent-100/15 px-2 py-0.5 text-xs text-accent-100">admin</span>
                            {/if}
                        </div>
                        {#if !u.admin}
                            <button
                                type="button"
                                onclick={() => deleteUser(u.id, u.username)}
                                class="flex size-7 cursor-pointer items-center justify-center rounded-md text-text-400 transition-colors hover:text-danger-100 hover:bg-danger-100/10"
                                aria-label="Delete user"
                            >
                                <Icon src={Trash} size="15" />
                            </button>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
