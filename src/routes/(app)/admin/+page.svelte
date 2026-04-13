<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { Icon, Trash } from "@xylightdev/svelte-hero-icons";
    import { user } from "$lib/state.svelte";
    import Alert from "$lib/components/Alert.svelte";
    import Button from "$lib/components/Button.svelte";
    import TextInput from "$lib/components/TextInput.svelte";

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
    <div class="max-w-xl px-12 py-10">
        <form onsubmit={createUser} class="flex flex-col gap-3 mb-10 rounded-md bg-bg-000 p-5 shadow-sm ring-1 ring-black/10 dark:ring-white/10">
            <h2 class="text-md font-medium text-text-200">Create a New User</h2>

            <TextInput
                id="username"
                label="Username"
                bind:value={username}
                required
                minlength={1}
                maxlength={24}
                pattern="[a-zA-Z0-9_]+"
            />

            <TextInput
                id="displayName"
                label="Display Name (optional)"
                bind:value={displayName}
                placeholder={username}
            />

            <TextInput
                id="password"
                label="Password"
                type="password"
                autocomplete="new-password"
                bind:value={password}
                required
                minlength={8}
            />

            {#if error}
                <Alert>{error}</Alert>
            {/if}

            {#if success}
                <Alert variant="success">{success}</Alert>
            {/if}

            <Button type="submit" disabled={loading} class="mt-1">
                {loading ? "Creating..." : "Create User"}
            </Button>
        </form>

        <div>
            <h2 class="mb-3 text-md font-medium text-text-200">List of Users</h2>
            <div class="rounded-md bg-bg-000 shadow-sm ring-1 ring-black/10 dark:ring-white/10 divide-y divide-black/5 dark:divide-border-300/15">
                {#each users as u (u.id)}
                    <div class="flex items-center justify-between px-4 py-3">
                        <div>
                            <span class="text-sm text-text-100">{u.displayName}</span>
                            <span class="ml-2 text-xs text-text-400">@{u.username}</span>

                            {#if u.admin}
                                <span class="ml-2 rounded-full bg-brand-100/15 px-2 py-0.5 text-xs text-brand-100">Admin</span>
                            {/if}
                        </div>

                        {#if !u.admin}
                            <button
                                type="button"
                                onclick={() => deleteUser(u.id, u.username)}
                                class="flex size-8 cursor-pointer items-center justify-center rounded-md text-text-400 transition-colors duration-100 hover:text-danger-100 hover:bg-danger-100/10"
                                aria-label="Delete User"
                            >
                                <Icon src={Trash} size="18" />
                            </button>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
