<script lang="ts">
    import { goto } from "$app/navigation";
    import { ArrowUp, Icon, Plus, Stop } from "@xylightdev/svelte-hero-icons";
    import {
        appendUserMessage,
        createChat,
        isStreaming,
        stopStream,
        streamReply,
    } from "$lib/chats.svelte";
    import { globalState } from "$lib/state.svelte";
    import ModelPicker from "./ModelPicker.svelte";
    import Tooltip from "./Tooltip.svelte";

    let {
        chatId,
        placeholder = "How can I help you today?",
        openUp = false,
    }: { chatId?: string; placeholder?: string; openUp?: boolean } = $props();

    let draft = $state("");
    let textarea: HTMLTextAreaElement;

    const streaming = $derived(chatId ? isStreaming(chatId) : false);
    const canSend = $derived(draft.trim().length > 0 && !streaming);

    function send() {
        if (!canSend) return;

        const content = draft.trim();
        draft = "";

        if (chatId) {
            appendUserMessage(chatId, content);
            streamReply(chatId, globalState.model);
            return;
        }

        const newChatId = createChat(content);
        goto(`/chat/${newChatId}`);
    }

    function stop() {
        if (chatId) stopStream(chatId);
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    }

    $effect(() => {
        draft;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    });
</script>

<div class="w-full max-w-2xl">
    <div
        class="flex flex-col gap-3 rounded-2xl bg-bg-000 p-3.5 shadow-xs ring-1 ring-black/10"
    >
        <textarea
            bind:this={textarea}
            bind:value={draft}
            onkeydown={handleKeyDown}
            rows="1"
            {placeholder}
            class="block max-h-96 min-h-12 w-full resize-none overflow-y-auto bg-transparent p-2 text-base text-text-100 placeholder:text-text-400 focus:outline-none"
        ></textarea>

        <div class="flex items-center justify-between">
            <Tooltip text="Add files">
                <button
                    type="button"
                    aria-label="Add files"
                    class="flex size-9 cursor-pointer items-center justify-center rounded-md text-text-300 transition-colors duration-100 hover:bg-bg-200"
                >
                    <Icon src={Plus} size="20" />
                </button>
            </Tooltip>

            <div class="flex items-center">
                <ModelPicker {openUp} />

                {#if streaming}
                    <div class="ml-1 w-8">
                        <button
                            type="button"
                            aria-label="Stop response"
                            onclick={stop}
                            class="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-brand-100 text-white"
                        >
                            <Icon src={Stop} size="16" solid />
                        </button>
                    </div>
                {:else}
                    <div
                        class="overflow-hidden transition-all duration-250 {canSend
                            ? 'ml-1 w-8'
                            : 'ml-0 w-0'}"
                    >
                        <button
                            type="button"
                            aria-label="Send message"
                            onclick={send}
                            class="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-brand-100 text-white"
                        >
                            <Icon src={ArrowUp} size="16" />
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
