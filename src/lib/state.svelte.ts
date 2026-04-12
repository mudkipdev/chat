export type GlobalState = {
    model: string;
    thinking: boolean;
    webSearch: boolean;
    sidebarCollapsed: boolean;
};

const STORAGE_KEY = "global-state";

const DEFAULTS: GlobalState = {
    model: "",
    thinking: false,
    webSearch: false,
    sidebarCollapsed: false,
};

function loadState(): GlobalState {
    if (typeof localStorage === "undefined") return { ...DEFAULTS };

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return { ...DEFAULTS };
        return { ...DEFAULTS, ...JSON.parse(stored) };
    } catch {
        return { ...DEFAULTS };
    }
}

export const globalState: GlobalState = $state(loadState());

if (typeof window !== "undefined") {
    $effect.root(() => {
        $effect(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
        });
    });
}
