<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        ArrowUp,
        CommandLine,
        GlobeAlt,
        Icon,
        LightBulb,
        Plus,
        Stop,
        XMark,
    } from "@xylightdev/svelte-hero-icons";
    import {
        appendUserMessage,
        chatError,
        chats,
        clearChatError,
        createChat,
        isStreaming,
        stopStream,
        streamReply,
    } from "$lib/chats.svelte";
    import { globalState, exaStatus, checkExaStatus, sandboxStatus, checkSandboxStatus } from "$lib/state.svelte";
    import ModelPicker from "./ModelPicker.svelte";
    import Tooltip from "./Tooltip.svelte";

    checkExaStatus();
    checkSandboxStatus();

    let {
        chatId,
        placeholder = "How can I help you today?",
        openUp = false,
    }: { chatId?: string; placeholder?: string; openUp?: boolean } = $props();

    type Attachment = {
        id: string;
        name: string;
        previewUrl: string;
        status: "uploading" | "ready" | "error";
        base64?: string;
    };

    type ToolId = "thinking" | "webBrowsing" | "sandbox";

    let draft = $state("");
    let attachments = $state<Attachment[]>([]);
    let textarea: HTMLTextAreaElement;
    let fileInput: HTMLInputElement;

    function openFilePicker() {
        fileInput?.click();
    }

    async function uploadFile(attachment: Attachment, file: File) {
        try {
            const form = new FormData();
            form.append("file", file);
            const response = await fetch("/api/uploads", {
                method: "POST",
                body: form,
            });
            if (!response.ok) {
                const text = await response.text().catch(() => "");
                chatError.message = `upload: ${text || response.status}`;
                attachments = attachments.filter((a) => a.id !== attachment.id);
                URL.revokeObjectURL(attachment.previewUrl);
                return;
            }
            const data = (await response.json()) as { base64: string };
            const target = attachments.find((a) => a.id === attachment.id);
            if (target) {
                target.base64 = data.base64;
                target.status = "ready";
            }
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            chatError.message = `upload: ${detail}`;
            attachments = attachments.filter((a) => a.id !== attachment.id);
            URL.revokeObjectURL(attachment.previewUrl);
        }
    }

    function handleFilesSelected(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        if (!input.files) return;

        const picked = Array.from(input.files).filter((f) =>
            f.type.startsWith("image/"),
        );
        input.value = "";
        if (picked.length === 0) return;

        const newAttachments: Attachment[] = picked.map((file) => ({
            id: crypto.randomUUID(),
            name: file.name,
            previewUrl: URL.createObjectURL(file),
            status: "uploading",
        }));
        attachments = [...attachments, ...newAttachments];

        newAttachments.forEach((attachment, i) => {
            uploadFile(attachment, picked[i]);
        });
    }

    function removeAttachment(id: string) {
        const target = attachments.find((a) => a.id === id);
        if (target) URL.revokeObjectURL(target.previewUrl);
        attachments = attachments.filter((a) => a.id !== id);
    }

    const streaming = $derived(chatId ? isStreaming(chatId) : false);
    const uploading = $derived(
        attachments.some((a) => a.status === "uploading"),
    );
    const canSend = $derived(
        draft.trim().length > 0 && !streaming && !uploading,
    );

    // Once tools have been used in a chat, browsing can't be disabled mid-conversation
    // because the model would see prior tool calls for tools that no longer exist.
    const browseLocked = $derived(
        chatId
            ? chats[chatId]?.messages.some((m) => m.role === "tool") ?? false
            : false,
    );
    const visibleTools = $derived([
        "thinking",
        ...(exaStatus.available ? (["webBrowsing"] as const) : []),
        ...(sandboxStatus.available ? (["sandbox"] as const) : []),
    ] as ToolId[]);

    function toolActive(tool: ToolId) {
        if (tool === "thinking") return globalState.thinking;
        if (tool === "webBrowsing") return globalState.webBrowsing;
        return globalState.sandbox;
    }

    function toolSelectionClass(tool: ToolId) {
        if (!toolActive(tool)) return "";

        const index = visibleTools.indexOf(tool);
        const previousActive = index > 0 && toolActive(visibleTools[index - 1]);
        const nextActive =
            index < visibleTools.length - 1 && toolActive(visibleTools[index + 1]);

        if (previousActive && nextActive) return "rounded-none";
        if (previousActive) return "rounded-l-none rounded-r-lg";
        if (nextActive) return "rounded-l-lg rounded-r-none";
        return "rounded-lg";
    }

    function send() {
        if (!canSend) return;

        const content = draft.trim();
        const images = attachments
            .filter((a) => a.status === "ready" && a.base64)
            .map((a) => a.base64!);

        draft = "";
        for (const a of attachments) URL.revokeObjectURL(a.previewUrl);
        attachments = [];
        clearChatError();

        if (chatId) {
            appendUserMessage(chatId, content, images);
            streamReply(chatId, globalState.model, globalState.thinking, globalState.webBrowsing, globalState.sandbox);
            return;
        }

        const newChatId = createChat(content, images);
        goto(`/chat/${newChatId}`);
    }

    function toggleThinking() {
        globalState.thinking = !globalState.thinking;
    }

    function toggleWebBrowsing() {
        globalState.webBrowsing = !globalState.webBrowsing;
    }

    function toggleSandbox() {
        globalState.sandbox = !globalState.sandbox;
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

<div class="w-full">
    {#if chatError.message}
        <div
            class="mb-2 flex items-start justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/60"
        >
            <span>{chatError.message}</span>
            <button
                type="button"
                aria-label="Dismiss error"
                onclick={clearChatError}
                class="cursor-pointer text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
            >
                ×
            </button>
        </div>
    {/if}
    <div
        class="flex flex-col gap-3 rounded-2xl bg-bg-000 p-3.5 shadow-sm ring-1 ring-black/10 dark:ring-white/10"
    >
        <input
            bind:this={fileInput}
            type="file"
            multiple
            accept="image/*"
            onchange={handleFilesSelected}
            class="hidden"
        />

        {#if attachments.length > 0}
            <div class="ml-1 flex flex-wrap gap-2">
                {#each attachments as attachment (attachment.id)}
                    <div class="group relative">
                        <img
                            src={attachment.previewUrl}
                            alt={attachment.name}
                            class="size-16 rounded-md object-cover ring-1 ring-black/10"
                        />
                        {#if attachment.status === "uploading"}
                            <div
                                class="absolute inset-0 flex items-center justify-center rounded-md bg-black/40"
                            >
                                <div
                                    class="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                                ></div>
                            </div>
                        {/if}
                        <button
                            type="button"
                            aria-label="Remove {attachment.name}"
                            onclick={() => removeAttachment(attachment.id)}
                            class="absolute -right-1.5 -top-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full bg-bg-000 text-text-200 opacity-0 shadow ring-1 ring-black/10 transition-opacity group-hover:opacity-100"
                        >
                            <Icon src={XMark} size="12" />
                        </button>
                    </div>
                {/each}
            </div>
        {/if}

        <textarea
            bind:this={textarea}
            bind:value={draft}
            onkeydown={handleKeyDown}
            rows="1"
            {placeholder}
            class="block max-h-96 min-h-12 w-full resize-none overflow-y-auto bg-transparent p-2 text-base text-text-100 placeholder:text-text-400 focus:outline-none"
        ></textarea>

        <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
                <Tooltip text="Add files">
                    <button
                        type="button"
                        aria-label="Add files"
                        onclick={openFilePicker}
                        class="flex size-9 cursor-pointer items-center justify-center rounded-lg text-text-300 transition-colors duration-100 hover:bg-bg-200"
                    >
                        <Icon src={Plus} size="20" />
                    </button>
                </Tooltip>

                <div class="flex items-center">
                    <Tooltip
                        text={globalState.thinking
                            ? "Disable thinking"
                            : "Enable thinking"}
                    >
                        <button
                            type="button"
                            aria-label="Enable thinking"
                            aria-pressed={globalState.thinking}
                            onclick={toggleThinking}
                            class="flex size-9 cursor-pointer items-center justify-center transition-all duration-200 ease-out {globalState.thinking
                                ? `bg-accent-100/10 text-accent-100 hover:bg-accent-100/15 ${toolSelectionClass('thinking')}`
                                : 'rounded-lg text-text-300 hover:bg-bg-200'}"
                        >
                            <Icon src={LightBulb} size="20" />
                        </button>
                    </Tooltip>

                    {#if exaStatus.available}
                        <Tooltip
                            text={browseLocked
                                ? "Start a new chat to disable web browsing"
                                : globalState.webBrowsing
                                  ? "Disable web browsing"
                                  : "Enable web browsing"}
                        >
                            <button
                                type="button"
                                aria-label="Enable web browsing"
                                aria-pressed={globalState.webBrowsing}
                                disabled={browseLocked}
                                onclick={toggleWebBrowsing}
                                class="flex size-9 items-center justify-center transition-all duration-200 ease-out {browseLocked
                                    ? `cursor-not-allowed bg-accent-100/10 text-accent-100 opacity-50 ${toolSelectionClass('webBrowsing')}`
                                    : globalState.webBrowsing
                                      ? `cursor-pointer bg-accent-100/10 text-accent-100 hover:bg-accent-100/15 ${toolSelectionClass('webBrowsing')}`
                                      : 'cursor-pointer rounded-lg text-text-300 hover:bg-bg-200'}"
                            >
                                <Icon src={GlobeAlt} size="20" />
                            </button>
                        </Tooltip>
                    {/if}

                    {#if sandboxStatus.available}
                        <Tooltip
                            text={globalState.sandbox
                                ? "Disable sandbox"
                                : "Enable sandbox"}
                        >
                            <button
                                type="button"
                                aria-label="Enable sandbox"
                                aria-pressed={globalState.sandbox}
                                onclick={toggleSandbox}
                                class="flex size-9 cursor-pointer items-center justify-center transition-all duration-200 ease-out {globalState.sandbox
                                    ? `bg-accent-100/10 text-accent-100 hover:bg-accent-100/15 ${toolSelectionClass('sandbox')}`
                                    : 'rounded-lg text-text-300 hover:bg-bg-200'}"
                            >
                                <Icon src={CommandLine} size="20" />
                            </button>
                        </Tooltip>
                    {/if}
                </div>
            </div>

            <div class="flex items-center">
                <ModelPicker {openUp} />

                {#if streaming}
                    <div class="ml-1 w-8">
                        <button
                            type="button"
                            aria-label="Stop response"
                            onclick={stop}
                            class="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-brand-100 text-white transition-colors hover:bg-brand-200 dark:bg-brand-000 dark:hover:bg-brand-200"
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
                            class="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-brand-100 text-white transition-colors hover:bg-brand-200 dark:bg-brand-000 dark:hover:bg-brand-200"
                        >
                            <Icon src={ArrowUp} size="16" />
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
