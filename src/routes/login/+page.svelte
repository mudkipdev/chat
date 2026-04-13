<script lang="ts">
    import { goto } from "$app/navigation";
    import { loadUser } from "$lib/state.svelte";
    import Alert from "$lib/components/Alert.svelte";
    import Button from "$lib/components/Button.svelte";
    import TextInput from "$lib/components/TextInput.svelte";

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

<div class="flex min-h-screen flex-col items-center px-6 pt-[26vh]">
    <div class="w-full max-w-sm">
        <h1 class="mb-8 text-center font-serif text-3xl font-light text-text-100">Welcome</h1>

        <form onsubmit={submit} class="flex flex-col gap-3">
            <TextInput
                id="username"
                label="Username"
                autocomplete="username"
                bind:value={username}
                required
            />

            <TextInput
                id="password"
                label="Password"
                type="password"
                autocomplete="current-password"
                bind:value={password}
                required
            />

            {#if error}
                <Alert>{error}</Alert>
            {/if}

            <Button type="submit" disabled={loading} class="mt-2">
                {loading ? "Signing in..." : "Sign in"}
            </Button>
        </form>
    </div>
</div>
