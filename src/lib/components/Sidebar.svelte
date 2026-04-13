<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { Bars3, ArrowRightStartOnRectangle, Trash, UserGroup, Icon, Plus, WrenchScrewdriver, AdjustmentsHorizontal } from "@xylightdev/svelte-hero-icons";
    import { deleteChat, loadRecents, recents, type RecentChat } from "$lib/chats.svelte";
    import { globalState, user, logout } from "$lib/state.svelte";
    import Tooltip from "./Tooltip.svelte";

    const collapsed = $derived(globalState.sidebarCollapsed);
    const activeId = $derived(page.params.uuid);

    function toggle() {
        globalState.sidebarCollapsed = !globalState.sidebarCollapsed;
    }

    function newChat() {
        goto("/");
    }

    function openChat(id: string) {
        goto(`/chat/${id}`);
    }

    function titleOf(chat: RecentChat): string {
        const base = chat.title?.trim() || chat.firstMessage.trim() || "Untitled";
        return base.length > 60 ? `${base.slice(0, 60)}…` : base;
    }

    async function removeChat(e: MouseEvent, id: string) {
        e.stopPropagation();
        await deleteChat(id);
        if (activeId === id) goto("/");
    }

    onMount(() => {
        if (!recents.loaded) loadRecents();
    });
</script>

{#if collapsed}
    <aside
        class="flex h-screen w-14 flex-col items-center gap-2 border-r border-black/5 dark:border-border-300/15 bg-bg-100 py-3"
    >
        <Tooltip text="Expand sidebar" placement="right">
            <button
                type="button"
                aria-label="Expand sidebar"
                onclick={toggle}
                class="flex size-9 cursor-pointer items-center justify-center rounded-md text-text-300 transition-colors duration-100 hover:bg-bg-300"
            >
                <Icon src={Bars3} size={20} />
            </button>
        </Tooltip>

        <Tooltip text="New chat" placement="right">
            <button
                type="button"
                aria-label="New chat"
                onclick={newChat}
                class="flex size-9 cursor-pointer items-center justify-center rounded-md text-text-300 transition-colors duration-100 hover:bg-bg-300"
            >
                <Icon src={Plus} size="20" />
            </button>
        </Tooltip>

        <div class="mt-auto pb-3">
            <Tooltip text="Sign out" placement="right">
                <button
                    type="button"
                    aria-label="Sign out"
                    onclick={logout}
                    class="flex size-9 cursor-pointer items-center justify-center rounded-md text-text-300 transition-colors duration-100 hover:bg-bg-300"
                >
                    <Icon src={ArrowRightStartOnRectangle} size="20" />
                </button>
            </Tooltip>
        </div>
    </aside>
{:else}
    <aside
        class="flex h-screen w-64 flex-col border-r border-black/5 dark:border-border-300/15 bg-bg-100"
    >
        <div class="flex items-center justify-between px-4 pt-4 pb-2">
            <span class="font-serif text-xl text-text-100">AI Chat</span>
            <Tooltip text="Collapse sidebar" placement="right">
                <button
                    type="button"
                    aria-label="Collapse sidebar"
                    onclick={toggle}
                    class="flex size-8 cursor-pointer items-center justify-center rounded-md text-text-300 transition-colors duration-100 hover:bg-bg-300"
                >
                    <Icon src={Bars3} size={20} />
                </button>
            </Tooltip>
        </div>

        <div class="px-2 pt-2">
            <button
                type="button"
                onclick={newChat}
                class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-text-100 transition-colors duration-100 hover:bg-bg-300"
            >
                <Icon src={Plus} size="18" />
                <span>New chat</span>
            </button>

            {#if user.info?.admin}
                <button
                    type="button"
                    onclick={() => goto("/admin")}
                    class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-text-100 transition-colors duration-100 hover:bg-bg-300"
                >
                    <Icon src={AdjustmentsHorizontal} size="18" />
                    <span>Manage users</span>
                </button>
            {/if}
        </div>

        <div
            class="mt-2 flex-1 overflow-y-auto px-2 pb-4"
        >
            <div
                class="px-2 pb-1 text-xs font-medium text-text-500"
            >
                {#if recents.items.length === 0}No chats yet{:else}Recents{/if}
            </div>

            {#if recents.items.length > 0}
                <ul class="flex flex-col">
                    {#each recents.items as chat (chat.id)}
                        <li class="group relative">
                            <button
                                type="button"
                                onclick={() => openChat(chat.id)}
                                class="flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 pr-8 text-left text-sm text-text-100 transition-colors duration-100 hover:bg-bg-300 {activeId === chat.id ? 'bg-bg-300' : ''}"
                            >
                                <span class="truncate">{titleOf(chat)}</span>
                            </button>
                            <button
                                type="button"
                                aria-label="Delete chat"
                                onclick={(e) => removeChat(e, chat.id)}
                                class="absolute right-1 top-1/2 -translate-y-1/2 flex size-6 cursor-pointer items-center justify-center rounded-md text-text-400 opacity-0 transition-opacity duration-100 hover:text-danger-100 group-hover:opacity-100"
                            >
                                <Icon src={Trash} size="14" />
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>

        {#if user.info}
            <div class="border-t border-black/5 dark:border-border-300/15 px-4 py-3 flex items-center justify-between">
                <span class="truncate text-sm text-text-300">{user.info.displayName}</span>
                <Tooltip text="Sign out" placement="top">
                    <button
                        type="button"
                        aria-label="Sign out"
                        onclick={logout}
                        class="flex size-7 cursor-pointer items-center justify-center rounded-md text-text-400 transition-colors duration-100 hover:text-text-100 hover:bg-bg-300"
                    >
                        <Icon src={ArrowRightStartOnRectangle} size="16" />
                    </button>
                </Tooltip>
            </div>
        {/if}
    </aside>
{/if}
