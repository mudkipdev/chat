export type GlobalState = {
    model: string;
    thinking: boolean;
    webBrowsing: boolean;
    sidebarCollapsed: boolean;
};

const STORAGE_KEY = "global-state";

const DEFAULTS: GlobalState = {
    model: "",
    thinking: false,
    webBrowsing: false,
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

export const exaStatus = $state({ available: false, checked: false });

export async function checkExaStatus(): Promise<void> {
    if (exaStatus.checked) return;
    try {
        const res = await fetch("/api/exa/status");
        if (res.ok) {
            const data = (await res.json()) as { available: boolean };
            exaStatus.available = data.available;
        }
    } catch {
        // Exa unavailable
    }
    exaStatus.checked = true;
}
