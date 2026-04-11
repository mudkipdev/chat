<script lang="ts">
    import { onMount } from "svelte";
    import { Check, ChevronDown, Icon } from "@xylightdev/svelte-hero-icons";
    import { globalState } from "../lib/state.svelte";
    import {
        fetchModels,
        parameterCount,
        type OllamaModel,
    } from "../lib/ollama";

    let { openUp = false }: { openUp?: boolean } = $props();

    let open = $state(false);
    let trigger: HTMLButtonElement | undefined = $state();
    let panel: HTMLDivElement | undefined = $state();

    let models = $state<OllamaModel[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    onMount(async () => {
        try {
            const fetched = await fetchModels();
            models = fetched.sort(
                (a, b) => parameterCount(b) - parameterCount(a),
            );
        } catch (e) {
            error = e instanceof Error ? e.message : "Failed to load models";
        } finally {
            loading = false;
        }
    });

    const current = $derived(
        models.find((m) => m.name === globalState.model) ?? models[0],
    );

    function select(name: string) {
        globalState.model = name;
        open = false;
    }

    function handleDocumentMouseDown(event: MouseEvent) {
        if (!open) return;
        const target = event.target as Node | null;
        if (!target) return;
        if (trigger?.contains(target) || panel?.contains(target)) return;
        open = false;
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape" && open) {
            open = false;
            trigger?.focus();
        }
    }

    $effect(() => {
        if (!open) return;
        document.addEventListener("mousedown", handleDocumentMouseDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleDocumentMouseDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    });
</script>

<div class="relative">
    <button
        bind:this={trigger}
        type="button"
        onclick={() => (open = !open)}
        class="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-text-300 transition-colors duration-100 hover:bg-bg-200"
    >
        <span>{current?.name ?? globalState.model}</span>
        <Icon src={ChevronDown} size="16" />
    </button>

    {#if open}
        <div
            bind:this={panel}
            role="menu"
            class="absolute right-0 z-50 w-64 rounded-lg bg-bg-000 p-2 shadow-lg ring-1 ring-black/10 {openUp
                ? 'bottom-full mb-2'
                : 'top-full mt-2'}"
        >
            {#if loading}
                <div class="px-3 py-2 text-sm text-text-400">Loading…</div>
            {:else if error}
                <div class="px-3 py-2 text-sm text-danger-100">{error}</div>
            {:else if models.length === 0}
                <div class="px-3 py-2 text-sm text-text-400">
                    No models found
                </div>
            {:else}
                {#each models as model (model.digest)}
                    <button
                        type="button"
                        role="menuitem"
                        onclick={() => select(model.name)}
                        class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-bg-200"
                    >
                        <div class="text-sm text-text-100">{model.name}</div>
                        {#if model.name === globalState.model}
                            <Icon
                                src={Check}
                                size="20"
                                class="text-accent-100"
                            />
                        {/if}
                    </button>
                {/each}
            {/if}
        </div>
    {/if}
</div>
