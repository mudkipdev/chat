const PROMPT_HEADER =
    "You are a helpful, honest, and thoughtful AI assistant. " +
    "Respond warmly and naturally, using clear prose rather than excessive formatting. " +
    "When uncertain, say so rather than guessing.";

export function createPrompt(): string {
    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return `${PROMPT_HEADER}\n\nThe current date is ${today}.`;
}
