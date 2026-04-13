<script lang="ts">
    import "./layout.css";
    import { onMount } from "svelte";
    import { loadUser, user } from "$lib/state.svelte";

    let { children } = $props();

    onMount(() => {
        if (!user.loaded) loadUser();
    });
</script>

<div class="min-h-screen bg-bg-100 text-text-100 font-sans">
    {@render children()}
</div>