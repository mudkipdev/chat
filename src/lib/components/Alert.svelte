<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        variant = "error",
        children,
    }: {
        variant?: "error" | "success";
        children: Snippet;
    } = $props();

    const styles: Record<string, string> = {
        error: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-800/40",
        success: "bg-green-100 text-green-700 ring-green-300 dark:bg-green-950/30 dark:text-green-300 dark:ring-green-800/40",
    };
</script>

<div class="rounded-md px-3 py-2 text-sm ring-1 {styles[variant]}">
    {@render children()}
</div>
