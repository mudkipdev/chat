<script lang="ts">
    import "./layout.css";
    let { children } = $props();
</script>

<div class="min-h-screen bg-bg-100 font-sans text-text-100">
    {@render children()}
</div>
