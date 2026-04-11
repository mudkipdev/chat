<script lang="ts">
    import PromptBox from "../components/PromptBox.svelte";
    import { pickGreeting } from "../lib/greeting";

    const greeting = pickGreeting({ kind: "named", name: "mudkip" });
</script>

<div class="flex min-h-screen flex-col items-center gap-10 px-6 pt-[26vh]">
    <h1 class="font-serif text-4xl font-light text-text-200">{greeting}</h1>
    <PromptBox />
</div>
