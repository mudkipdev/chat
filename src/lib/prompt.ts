export interface ToolAvailability {
    webBrowsing: boolean;
    sandbox: boolean;
}

export interface PromptContext {
    model: string;
    tools: ToolAvailability;
    date: Date;
}

export function createPrompt(context: PromptContext): string {
    const formattedDate = context.date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    let prompt = "You are a helpful, honest, and thoughtful AI assistant.";
    prompt += " Respond warmly and naturally, using clear prose rather than excessive formatting.";
    prompt += `\nThe current date is ${formattedDate}.`;

    if (context.tools.webBrowsing) {
        prompt += "\n\nYou have access to the web for retrieving up-to-date information.";
        prompt += "\nUse it when a question involves recent events, current data, or anything that may have changed since your training cutoff";
    }

    if (context.tools.sandbox) {
        prompt += "\n\nYou have access to a sandboxed Linux environment with Python, Node.js, and other useful packages.";
        prompt += "\nYou can use it for a wide range of tasks, but it is most useful for computation, data analysis, and chart generation.";
        prompt += "\nOnce you're done with a file, immediately send it to the user by using the ![file_name.txt](/home/user/file_name.txt) syntax in your response."
    }

    return prompt;
}
