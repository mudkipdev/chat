<script lang="ts">
    import {
        ArrowPath,
        Check,
        Icon,
        Square2Stack,
    } from "@xylightdev/svelte-hero-icons";
    import Tooltip from "./Tooltip.svelte";

    let {
        content,
        onRetry,
    }: { content: string; onRetry?: () => void } = $props();

    let copied = $state(false);
    let copyTimer: ReturnType<typeof setTimeout> | undefined;

    async function copy() {
        try {
            await navigator.clipboard.writeText(content);
            copied = true;
            clearTimeout(copyTimer);
            copyTimer = setTimeout(() => (copied = false), 2000);
        } catch {}
    }
</script>

<div
    class="-ml-1.5 mt-2 flex items-center gap-1"
    role="group"
    aria-label="Message actions"
>
    <Tooltip text="Copy">
        <button
            type="button"
            aria-label="Copy"
            onclick={copy}
            class="group relative flex size-8 items-center justify-center text-text-500 transition-colors duration-100 hover:text-text-100"
        >
            <span
                class="absolute inset-0 rounded-md transition-all duration-100 group-hover:bg-bg-300 group-active:scale-90"
            ></span>
            <span class="relative inline-flex">
                <span
                    class="inline-flex transition-opacity {copied
                        ? 'opacity-0 duration-0'
                        : 'opacity-100 duration-150'}"
                >
                    <Icon src={Square2Stack} size="18" />
                </span>
                <span
                    class="absolute inset-0 inline-flex transition-opacity {copied
                        ? 'opacity-100 duration-0'
                        : 'opacity-0 duration-150'}"
                >
                    <Icon src={Check} size="18" />
                </span>
            </span>
        </button>
    </Tooltip>

    <Tooltip text="Retry">
        <button
            type="button"
            aria-label="Retry"
            onclick={onRetry}
            class="group relative flex size-8 items-center justify-center text-text-500 transition-colors duration-100 hover:text-text-100"
        >
            <span
                class="absolute inset-0 rounded-md transition-all duration-100 group-hover:bg-bg-300 group-active:scale-90"
            ></span>
            <span class="relative">
                <Icon src={ArrowPath} size="18" />
            </span>
        </button>
    </Tooltip>
</div>
