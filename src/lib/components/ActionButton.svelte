<script lang="ts">
    import type { Snippet } from "svelte";
    import Tooltip from "./Tooltip.svelte";

    let {
        label,
        onclick,
        children,
    }: {
        label: string;
        onclick?: () => void;
        children: Snippet;
    } = $props();
</script>

<Tooltip text={label}>
    <button
        type="button"
        aria-label={label}
        {onclick}
        class="group relative flex size-8 cursor-pointer items-center justify-center text-text-500 transition-colors duration-100 hover:text-text-100"
    >
        <span
            class="absolute inset-0 rounded-md transition-all duration-100 group-hover:bg-bg-300 group-active:scale-90"
        ></span>

        <span class="relative inline-flex">
            {@render children()}
        </span>
    </button>
</Tooltip>
