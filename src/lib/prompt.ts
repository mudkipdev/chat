const promptHeader = "You are a helpful, honest, and thoughtful AI assistant. Respond warmly and naturally, using clear prose rather than excessive formatting. When uncertain, say so rather than guessing.";

export function createPrompt() {
    return promptHeader + "\n\n" + `The current date is ${new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    })}.`;
}