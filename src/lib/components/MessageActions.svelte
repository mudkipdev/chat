<script lang="ts">
    import {
        ArrowPath,
        Check,
        Icon,
        Square2Stack,
    } from "@xylightdev/svelte-hero-icons";
    import ActionButton from "./ActionButton.svelte";

    let {
        content,
        onRetry,
    }: { content: string; onRetry?: () => void } = $props();

    let copied = $state(false);
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    async function copy() {
        try {
            await navigator.clipboard.writeText(content);
            copied = true;
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => (copied = false), 2000);
        } catch {}
    }
</script>

<div
    class="-ml-1.5 mt-2 flex items-center gap-1"
    role="group"
    aria-label="Message actions"
>
    <ActionButton label="Copy" onclick={copy}>
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
    </ActionButton>

    <ActionButton label="Retry" onclick={onRetry}>
        <Icon src={ArrowPath} size="18" />
    </ActionButton>
</div>
