<script lang="ts">
    import { marked } from "marked";
    let { content }: { content: string } = $props();
    marked.setOptions({ breaks: true, gfm: true });
    const html = $derived(marked.parse(content, { async: false }) as string);
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

        color: var(--color-red-400);
        border: 1px solid hsl(var(--border-300) / 0.2);
        border-radius: 6px;
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
</style>