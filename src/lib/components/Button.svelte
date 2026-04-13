<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        type = "button",
        variant = "brand",
        disabled = false,
        class: className = "",
        onclick,
        children,
    }: {
        type?: "button" | "submit";
        variant?: "brand" | "danger" | "ghost";
        disabled?: boolean;
        class?: string;
        onclick?: () => void;
        children: Snippet;
    } = $props();

    const base = "inline-flex cursor-pointer items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50 w-full";

    const variants: Record<string, string> = {
        brand: "bg-brand-100 text-white hover:bg-brand-200",
        danger: "bg-danger-100 text-white hover:bg-danger-200",
        ghost: "text-text-300 hover:bg-bg-300 hover:text-text-100",
    };
</script>

<button
    {type}
    {disabled}
    {onclick}
    class="{base} {variants[variant]} {className}"
>
    {@render children()}
</button>
