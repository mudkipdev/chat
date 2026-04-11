export type GlobalState = {
    model: string;
    reasoning: boolean;
    webSearch: boolean;
};

const STORAGE_KEY = "global-state";

const defaults: GlobalState = {
    model: "gemma4:e2b",
    reasoning: false,
    webSearch: false,
};

function load(): GlobalState {
    if (typeof localStorage === "undefined") return { ...defaults };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...defaults };
        return { ...defaults, ...JSON.parse(raw) };
    } catch {
        return { ...defaults };
    }
}

export const globalState: GlobalState = $state(load());

if (typeof window !== "undefined") {
    $effect.root(() => {
        $effect(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
        });
    });
}
