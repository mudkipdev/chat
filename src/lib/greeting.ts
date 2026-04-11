export type Identity =
    | { kind: "named"; name: string }
    | { kind: "incognito" }
    | { kind: "unauthenticated" };

type TimeOfDay = "morning" | "afternoon" | "evening" | "lateNight";

const WEEKDAY_GREETINGS: Record<number, string> = {
    1: "Happy Monday",
    2: "Happy Tuesday",
    3: "Happy Wednesday",
    4: "Happy Thursday",
    5: "Happy Friday",
};

function hash(input: string): number {
    let value = 0;

    for (let i = 0; i < input.length; i++) {
        value = (value << 5) - value + input.charCodeAt(i);
        value &= 0xffffffff;
    }

    return Math.abs(value);
}

function timeOfDay(hour: number): TimeOfDay {
    if (hour > 0 && hour < 5) return "lateNight";
    if (hour > 5 && hour < 12) return "morning";
    if (hour > 12 && hour < 18) return "afternoon";
    return "evening";
}

function isGoldenHour(date: Date, hour: number): boolean {
    const seed = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_golden_hour`;
    const earlySlot = hash(seed) % 2 === 0;
    return earlySlot ? hour > 16 && hour < 18 : hour > 18 && hour < 19;
}

function buildPool(
    identity: Identity,
    time: TimeOfDay,
    day: number,
    goldenHour: boolean,
): string[] {
    const pool: string[] = [];
    const named = identity.kind === "named";
    const tail = named ? `, ${identity.name}` : "";

    if (identity.kind === "incognito") {
        if (time === "morning") pool.push("Let's chat incognito");
        if (time === "afternoon") pool.push("Greetings, whoever you are");
        if (time === "evening" || time === "lateNight") pool.push("You're incognito");
        return pool;
    }

    if (time === "morning") {
        pool.push(`Good morning${tail}`);
        pool.push(`Welcome${tail}`);
        pool.push(`Hey there${tail}`);

        const weekday = WEEKDAY_GREETINGS[day];
        if (weekday) pool.push(`${weekday}${tail}`);

        if (day === 6) {
            pool.push(`Welcome to the weekend${tail}`);
            pool.push(`Happy Saturday${tail}`);
        }

        if (day === 0) {
            pool.push(`Sunday session${tail}?`);
            pool.push(`Happy Sunday${tail}`);
        }

        pool.push("Coffee and Claude time?");
    }

    if (time === "afternoon") {
        pool.push(`Good afternoon${tail}`);
        pool.push(`Afternoon${tail}`);
        pool.push(named ? `Back at it, ${identity.name}` : "Back at it!");
    }

    if (time === "evening") {
        pool.push(`Good evening${tail}`);
        pool.push(`Evening${tail}`);
        if (named) pool.push(`${identity.name} returns!`);
    }

    if (time === "lateNight") {
        pool.push(named ? `It's late-night ${identity.name}` : "It's late-night");
        pool.push("Moonlit chat?");
        pool.push("Hello, night owl");
        pool.push("What shall we think through?");
    }

    if (goldenHour) pool.push("Golden hour thinking");

    return pool;
}

export function pickGreeting(identity: Identity): string {
    const date = new Date();
    const hour = date.getHours();
    const day = date.getDay();
    const time = timeOfDay(hour);
    const goldenHour = isGoldenHour(date, hour);

    const pool = buildPool(identity, time, day, goldenHour);

    if (pool.length === 0) {
        pool.push(identity.kind === "named" ? `Hey there, ${identity.name}` : "Hey there");
    }

    const persona =
        identity.kind === "incognito"
            ? "incognito"
            : identity.kind === "named"
              ? "with_name"
              : "no_name";

    const seed = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${time}_${persona}`;
    return pool[hash(seed) % pool.length];
}
