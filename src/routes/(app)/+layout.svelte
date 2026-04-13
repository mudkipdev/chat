<script lang="ts">
    import Sidebar from "$lib/components/Sidebar.svelte";

    let { children } = $props();
</script>

<div class="flex min-h-screen">
    <Sidebar />
    <div class="flex-1 min-w-0">
        {@render children()}
    </div>
</div>
