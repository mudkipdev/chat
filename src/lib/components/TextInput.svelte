<script lang="ts">
    let {
        id,
        label,
        type = "text",
        value = $bindable(""),
        placeholder,
        required = false,
        autocomplete,
        minlength,
        maxlength,
        pattern,
    }: {
        id: string;
        label: string;
        type?: "text" | "password";
        value?: string;
        placeholder?: string;
        required?: boolean;
        autocomplete?: AutoFill;
        minlength?: number;
        maxlength?: number;
        pattern?: string;
    } = $props();
</script>

<div class="flex flex-col gap-1.5">
    <label for={id} class="text-sm text-text-300">{label}</label>
    <input
        {id}
        {type}
        {placeholder}
        {required}
        {autocomplete}
        {minlength}
        {maxlength}
        {pattern}
        bind:value
        class="rounded-md bg-bg-000 px-3 py-2 text-sm text-text-100 ring-1 ring-black/10 dark:ring-white/10 outline-none transition-shadow focus:ring-2 focus:ring-brand-100/50"
    />
</div>
