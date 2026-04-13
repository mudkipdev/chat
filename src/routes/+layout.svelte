<script lang="ts">
    import "./layout.css";
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import Sidebar from "$lib/components/Sidebar.svelte";
    import { loadUser, user } from "$lib/state.svelte";

    let { children } = $props();

    const isAuthPage = $derived(page.url.pathname.startsWith("/login"));

    onMount(() => {
        if (!user.loaded) loadUser();
    });
</script>

{#if isAuthPage}
    {@render children()}
{:else}
    <div class="flex min-h-screen bg-bg-100 font-sans text-text-100">
        <Sidebar />
        <div class="flex-1 min-w-0">
            {@render children()}
        </div>
    </div>
{/if}
