<script lang="ts">
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { ChevronRight, Icon } from "@xylightdev/svelte-hero-icons";
    import Markdown from "$lib/components/Markdown.svelte";
    import MessageActions from "$lib/components/MessageActions.svelte";
    import PromptBox from "$lib/components/PromptBox.svelte";
    import { chats, loadChat, retryLast, streamReply } from "$lib/chats.svelte";
    import { globalState } from "$lib/state.svelte";

    const chatId = $derived(page.params.uuid!);
    const chat = $derived(chats[chatId]);

    let thinkingOpen = $state<Record<string, boolean>>({});

    function toggleThinking(id: string) {
        thinkingOpen[id] = !thinkingOpen[id];
    }

    onMount(async () => {
        if (!chats[chatId]) {
            const loaded = await loadChat(chatId);
            if (!loaded) {
                goto("/");
                return;
            }
        }

        const current = chats[chatId];
        const last = current.messages[current.messages.length - 1];
        if (last?.role === "user")
            streamReply(chatId, globalState.model, globalState.thinking, globalState.webBrowsing);
    });
</script>

<div class="flex h-screen flex-col">
    <div class="flex-1 overflow-y-auto">
        <div class="mx-auto max-w-2xl space-y-6 px-6 py-10">
            {#if chat}
                {#each chat.messages as message, index (index)}
                    {#if message.role === "tool"}
                        <!-- tool results are internal context, not displayed -->
                    {:else if message.role === "assistant" && message.tool_calls?.length}
                        <!-- tool-calling assistant messages are internal context, not displayed -->
                    {:else if message.role === "user"}
                        <div class="flex justify-end">
                            <div
                                class="max-w-[80%] whitespace-pre-wrap rounded-lg bg-bg-300 px-4 py-2.5 text-text-100"
                            >
                                {message.content}
                            </div>
                        </div>
                    {:else}
                        <div>
                            {#if message.thinking}
                                <div class="mb-3 font-sans">
                                    <button
                                        type="button"
                                        onclick={() => toggleThinking(message.id)}
                                        class="flex cursor-pointer items-center gap-1 -ml-1 text-sm text-text-400 hover:text-text-200"
                                    >
                                        <span
                                            class="flex transition-transform duration-200 ease-out {thinkingOpen[
                                                message.id
                                            ]
                                                ? 'rotate-90'
                                                : ''}"
                                        >
                                            <Icon src={ChevronRight} size="16" />
                                        </span>

                                        <span>
                                            {thinkingOpen[message.id]
                                                ? "Hide thinking"
                                                : "Show thinking"}
                                        </span>
                                    </button>
                                    {#if thinkingOpen[message.id]}
                                        <div
                                            transition:slide={{ duration: 200, easing: cubicOut }}
                                            class="mt-2 whitespace-pre-wrap border-l border-bg-400 pl-6 text-sm text-text-400"
                                        >
                                            {message.thinking}
                                        </div>
                                    {/if}
                                </div>
                            {/if}

                            <div class="font-serif text-text-100">
                                <Markdown content={message.content} />
                            </div>

                            {#if message.error}
                                <div
                                    class="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                                    role="alert"
                                >
                                    {message.error}
                                </div>
                            {/if}

                            {#if message.done !== false}
                                <MessageActions
                                    content={message.content}
                                    onRetry={() =>
                                        retryLast(
                                            chatId,
                                            globalState.model,
                                            globalState.thinking,
                                            globalState.webBrowsing,
                                        )}
                                />
                            {/if}
                        </div>
                    {/if}
                {/each}
            {/if}
        </div>
    </div>

    <div class="bg-bg-100 pb-8 pt-2">
        <div class="mx-auto flex w-full max-w-2xl justify-center px-6">
            <PromptBox {chatId} placeholder="Reply..." openUp />
        </div>
    </div>
</div>
