<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        text,
        children,
    }: { text: string; children: Snippet } = $props();
</script>

<div class="group relative inline-flex">
    {@render children()}
    <div
        role="tooltip"
        class="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 max-w-50 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs font-normal text-white shadow-md backdrop-blur group-hover:visible"
    >
        {text}
    </div>
</div>
