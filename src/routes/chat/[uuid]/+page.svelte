<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import MessageActions from "$lib/components/MessageActions.svelte";
    import PromptBox from "$lib/components/PromptBox.svelte";
    import { chats, retryLast, streamReply } from "$lib/chats.svelte";
    import { globalState } from "$lib/state.svelte";

    const chatId = $derived(page.params.uuid!);
    const chat = $derived(chats[chatId]);

    onMount(() => {
        if (!chat) {
            goto("/");
            return;
        }

        const last = chat.messages[chat.messages.length - 1];
        if (last?.role === "user") streamReply(chatId, globalState.model);
    });
</script>

<div class="flex h-screen flex-col">
    <div class="flex-1 overflow-y-auto">
        <div class="mx-auto max-w-2xl space-y-6 px-6 py-10">
            {#if chat}
                {#each chat.messages as message, index (index)}
                    {#if message.role === "user"}
                        <div class="flex justify-end">
                            <div
                                class="max-w-[80%] whitespace-pre-wrap rounded-lg bg-bg-300 px-4 py-2.5 text-text-100"
                            >
                                {message.content}
                            </div>
                        </div>
                    {:else}
                        <div>
                            <div
                                class="whitespace-pre-wrap font-serif text-text-100"
                            >
                                {message.content}
                            </div>

                            {#if message.done !== false}
                                <MessageActions
                                    content={message.content}
                                    onRetry={() =>
                                        retryLast(chatId, globalState.model)}
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
