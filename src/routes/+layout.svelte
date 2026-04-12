<script lang="ts">
    import "./layout.css";
    import Sidebar from "$lib/components/Sidebar.svelte";
    let { children } = $props();
</script>

<div class="flex min-h-screen bg-bg-100 font-sans text-text-100">
    <Sidebar />
    <div class="flex-1 min-w-0">
        {@render children()}
    </div>
</div>
