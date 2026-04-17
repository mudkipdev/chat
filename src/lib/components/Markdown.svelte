<script lang="ts">
    import { marked, type Tokens } from "marked";
    import { ArrowDownTray, DocumentText, Icon } from "@xylightdev/svelte-hero-icons";

    let { content, sandboxId }: { content: string; sandboxId?: string } = $props();

    const SANDBOX_PREFIX = "/home/user/";

    const renderer = new marked.Renderer();

    renderer.image = ({ href, text }: Tokens.Image) => {
        if (href.startsWith(SANDBOX_PREFIX)) {
            const fileName = text || href.split("/").pop() || "file";
            const downloadUrl = sandboxId
                ? `/api/sandbox/file?sandbox=${encodeURIComponent(sandboxId)}&path=${encodeURIComponent(href)}`
                : "#";

            return `<div class="sandbox-file">
                <div class="sandbox-file-info">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                    <span>${fileName}</span>
                </div>
                <a href="${downloadUrl}" download="${fileName}" class="sandbox-file-download">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
            </div>`;
        }

        return `<img src="${href}" alt="${text}" />`;
    };

    marked.setOptions({ breaks: true, gfm: true });
    const html = $derived(marked.parse(content, { renderer, async: false }) as string);
</script>

<div class="markdown">
    {@html html}
</div>

<style>
    .markdown :global(p) {
        margin: 0 0 0.75rem 0;
        line-height: 1.6;
    }

    .markdown :global(p:last-child) {
        margin-bottom: 0;
    }

    .markdown :global(h1),
    .markdown :global(h2),
    .markdown :global(h3),
    .markdown :global(h4) {
        font-weight: 600;
        margin: 1.25rem 0 0.5rem 0;
        line-height: 1.3;
    }

    .markdown :global(h1) {
        font-size: 1.5rem;
    }

    .markdown :global(h2) {
        font-size: 1.25rem;
    }

    .markdown :global(h3) {
        font-size: 1.1rem;
    }

    .markdown :global(h4) {
        font-size: 1rem;
    }

    .markdown :global(ul),
    .markdown :global(ol) {
        margin: 0 0 0.75rem 0;
        padding-left: 1.5rem;
    }

    .markdown :global(ul) {
        list-style-type: disc;
    }

    .markdown :global(ol) {
        list-style-type: decimal;
    }

    .markdown :global(li) {
        margin: 0.25rem 0;
        line-height: 1.6;
    }

    .markdown :global(li > p) {
        margin: 0;
    }

    .markdown :global(code) {
        font-weight: normal !important; /* to prevent bold */
        padding: 2px 4px;
        margin: 0px 2px;

        font-family: var(--font-mono);
        font-size: 0.8em;

        color: var(--color-red-700);
        border: 1px solid hsl(var(--border-300) / 0.2);
        border-radius: 6px;
    }

    @media (prefers-color-scheme: dark) {
        .markdown :global(code) {
            color: var(--color-red-400);
        }
    }

    .markdown :global(pre) {
        margin: 0.75rem 0;
        padding: 0.9rem 1rem;
        background: hsl(var(--bg-200));
        border-radius: 8px;
        overflow-x: auto;
        font-size: 0.9em;
        line-height: 1.5;
    }

    .markdown :global(pre code) {
        padding: 0;
        background: transparent;
        border-radius: 0;
        font-size: inherit;
    }

    .markdown :global(blockquote) {
        margin: 0.75rem 0;
        padding-left: 1rem;
        border-left: 3px solid hsl(var(--text-400));
        color: hsl(var(--text-300));
    }

    .markdown :global(a) {
        color: white;
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    .markdown :global(a:hover) {
        opacity: 0.8;
    }

    .markdown :global(hr) {
        margin: 1.25rem 0;
        border: 0;
        border-top: 1px solid hsl(var(--text-400) / 0.3);
    }

    .markdown :global(table) {
        margin: 0.75rem 0;
        border-collapse: separate;
        border-spacing: 0;
        width: 100%;
        border: 1px solid hsl(var(--text-400) / 0.3);
        border-radius: 8px;
        overflow: hidden;
    }

    .markdown :global(th),
    .markdown :global(td) {
        padding: 0.5rem 0.75rem;
        border-right: 1px solid hsl(var(--text-400) / 0.3);
        border-bottom: 1px solid hsl(var(--text-400) / 0.3);
        text-align: left;
    }

    .markdown :global(th:last-child),
    .markdown :global(td:last-child) {
        border-right: none;
    }

    .markdown :global(tbody tr:last-child td) {
        border-bottom: none;
    }

    .markdown :global(th) {
        background: hsl(var(--bg-200));
        font-weight: 600;
    }

    .markdown :global(img) {
        max-width: 100%;
        border-radius: 6px;
    }

    .markdown :global(strong) {
        font-weight: 600;
    }

    .markdown :global(.sandbox-file) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0.75rem 0;
        padding: 0.75rem 1rem;
        border: 1px solid hsl(var(--border-300) / 0.2);
        border-radius: 8px;
        background: hsl(var(--bg-200));
        font-family: var(--font-sans);
    }

    .markdown :global(.sandbox-file-info) {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: hsl(var(--text-200));
        font-size: 0.875rem;
    }

    .markdown :global(.sandbox-file-download) {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 6px;
        color: hsl(var(--text-300));
        text-decoration: none;
        transition: background 0.1s, color 0.1s;
    }

    .markdown :global(.sandbox-file-download:hover) {
        background: hsl(var(--bg-300));
        color: hsl(var(--text-100));
        opacity: 1;
    }
</style>
