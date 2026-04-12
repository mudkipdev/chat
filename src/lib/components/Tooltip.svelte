<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        text,
        placement = "top",
        children,
    }: {
        text: string;
        placement?: "top" | "right";
        children: Snippet;
    } = $props();

    const positionClasses = {
        top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
        right: "left-full top-1/2 ml-1.5 -translate-y-1/2",
    };
</script>

<div class="group relative inline-flex">
    {@render children()}
    <div
        role="tooltip"
        class="pointer-events-none invisible absolute z-50 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-center text-xs font-normal text-white shadow-md backdrop-blur group-hover:visible {positionClasses[
            placement
        ]}"
    >
        {text}
    </div>
</div>
