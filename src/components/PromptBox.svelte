<script lang="ts">
    import { goto } from "$app/navigation";
    import { ArrowUp, Icon, Plus } from "@xylightdev/svelte-hero-icons";
    import Tooltip from "./Tooltip.svelte";
    import ModelPicker from "./ModelPicker.svelte";
    import {
        appendUserMessage,
        createChat,
        streamReply,
    } from "../lib/chats.svelte";
    import { globalState } from "../lib/state.svelte";

    let {
        chatId,
        placeholder = "How can I help you today?",
        openUp = false,
    }: { chatId?: string; placeholder?: string; openUp?: boolean } = $props();

    let value = $state("");
    let textarea: HTMLTextAreaElement;

    const canSend = $derived(value.trim().length > 0);

    function send() {
        if (!canSend) return;
        const content = value.trim();
        value = "";
        if (chatId) {
            appendUserMessage(chatId, content);
            streamReply(chatId, globalState.model);
        } else {
            const id = createChat(content);
            goto(`/chat/${id}`);
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    }

    $effect(() => {
        value;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
    });
</script>

<div class="w-full max-w-2xl">
    <div class="flex flex-col gap-3 rounded-2xl bg-bg-000 p-3.5 shadow-xs ring-1 ring-black/10">
        <textarea
            bind:this={textarea}
            bind:value
            onkeydown={handleKeyDown}
            rows="1"
            {placeholder}
            class="block max-h-96 min-h-12 p-2 w-full resize-none overflow-y-auto bg-transparent text-base text-text-100 placeholder:text-text-400 focus:outline-none"
        ></textarea>

        <div class="flex items-center justify-between">
            <Tooltip text="Add files">
                <button
                    type="button"
                    aria-label="Add files"
                    class="flex size-9 items-center justify-center rounded-md text-text-300 transition-colors duration-100 hover:bg-bg-200"
                >
                    <Icon src={Plus} size="20" />
                </button>
            </Tooltip>

            <div class="flex items-center">
                <ModelPicker {openUp} />
                <div
                    class="overflow-hidden transition-all duration-250 {canSend
                        ? 'ml-1 w-8'
                        : 'ml-0 w-0'}"
                >
                    <button
                        type="button"
                        aria-label="Send message"
                        onclick={send}
                        class="flex size-8 items-center justify-center rounded-lg bg-brand-100 text-white"
                    >
                        <Icon src={ArrowUp} size="16" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>