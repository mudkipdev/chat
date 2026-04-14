export type UserInfo = {
    id: string;
    username: string;
    displayName: string;
    admin: boolean;
};

export type GlobalState = {
    model: string;
    thinking: boolean;
    webBrowsing: boolean;
    sandbox: boolean;
    sidebarCollapsed: boolean;
};

const STORAGE_KEY = "global-state";

const DEFAULTS: GlobalState = {
    model: "",
    thinking: false,
    webBrowsing: false,
    sandbox: false,
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

export const user = $state<{ info: UserInfo | null; loaded: boolean }>({
    info: null,
    loaded: false,
});

export async function loadUser(): Promise<UserInfo | null> {
    try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
            user.info = (await res.json()) as UserInfo;
        } else {
            user.info = null;
        }
    } catch {
        user.info = null;
    }
    user.loaded = true;
    return user.info;
}

export async function logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
    user.info = null;
    window.location.href = "/login";
}

export const exaStatus = $state({ available: false, checked: false });
export const sandboxStatus = $state({ available: false, checked: false });

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

export async function checkSandboxStatus(): Promise<void> {
    if (sandboxStatus.checked) return;
    try {
        const res = await fetch("/api/sandbox/status");
        if (res.ok) {
            const data = (await res.json()) as { available: boolean };
            sandboxStatus.available = data.available;
        }
    } catch {
        // Sandbox unavailable
    }
    sandboxStatus.checked = true;
}
