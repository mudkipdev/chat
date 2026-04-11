export type Identity =
    | { kind: "named"; name: string }
    | { kind: "incognito" }
    | { kind: "unauthenticated" };

function hashString(string: string): number {
    let t = 0;

    for (let i = 0; i < string.length; i++) {
        t = (t << 5) - t + string.charCodeAt(i);
        t &= 0xffffffff;
    }

    return Math.abs(t);
}

export function pickGreeting(identity: Identity): string {
    const date = new Date();
    const hour = date.getHours();
    const day = date.getDay();

    const morning = hour > 5 && hour < 12;
    const afternoon = hour > 12 && hour < 18;
    const evening = hour > 18 && hour < 24;
    const lateNight = hour > 0 && hour < 5;

    const goldenSeed = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_golden_hour`;
    const isGoldenDay = hashString(goldenSeed) % 2 === 0;
    const goldenHour = isGoldenDay
        ? hour > 16 && hour < 18
        : hour > 18 && hour < 19;

    const pool: string[] = [];

    if (identity.kind === "named") {
        const n = identity.name;
        if (morning) {
            pool.push(`Good morning, ${n}`);
            pool.push(`Welcome, ${n}`);
            pool.push(`Hey there, ${n}`);

            if (day === 1) pool.push(`Happy Monday, ${n}`);
            if (day === 2) pool.push(`Happy Tuesday, ${n}`);
            if (day === 3) pool.push(`Happy Wednesday, ${n}`);
            if (day === 4) pool.push(`Happy Thursday, ${n}`);
            if (day === 5) pool.push(`Happy Friday, ${n}`);

            if (day === 6) {
                pool.push(`Welcome to the weekend, ${n}`);
                pool.push(`Happy Saturday, ${n}`);
            }

            if (day === 0) {
                pool.push(`Sunday session, ${n}?`);
                pool.push(`Happy Sunday, ${n}`);
            }
        }

        if (afternoon) {
            pool.push(`Good afternoon, ${n}`);
            pool.push(`Afternoon, ${n}`);
            pool.push(`Back at it, ${n}`);
        }

        if (evening) {
            pool.push(`${n} returns!`);
            pool.push(`Good evening, ${n}`);
            pool.push(`Evening, ${n}`);
        }

        if (lateNight) {
            pool.push(`It's late-night ${n}`);
        }
    }

    if (identity.kind === "unauthenticated") {
        if (morning) {
            pool.push("Good morning");
            pool.push("Welcome");
            pool.push("Hey there");

            if (day === 1) pool.push("Happy Monday");
            if (day === 2) pool.push("Happy Tuesday");
            if (day === 3) pool.push("Happy Wednesday");
            if (day === 4) pool.push("Happy Thursday");
            if (day === 5) pool.push("Happy Friday");

            if (day === 6) {
                pool.push("Welcome to the weekend");
                pool.push("Happy Saturday!");
            }

            if (day === 0) {
                pool.push("Sunday session?");
                pool.push("Happy Sunday");
            }
        }

        if (afternoon) {
            pool.push("Good afternoon");
            pool.push("Afternoon");
            pool.push("Back at it!");
        }

        if (evening) {
            pool.push("Evening");
            pool.push("Good evening");
        }

        if (lateNight) {
            pool.push("It's late-night");
        }
    }

    if (identity.kind !== "incognito") {
        if (morning) pool.push("Coffee and Claude time?");
        if (goldenHour) pool.push("Golden hour thinking");

        if (lateNight) {
            pool.push("Moonlit chat?");
            pool.push("Hello, night owl");
            pool.push("What shall we think through?");
        }
    }

    if (identity.kind === "incognito") {
        if (morning) pool.push("Let's chat incognito");
        if (afternoon) pool.push("Greetings, whoever you are");
        if (evening || lateNight) pool.push("You're incognito");
    }

    if (pool.length === 0) {
        pool.push(identity.kind === "named" ? `Hey there, ${identity.name}` : "Hey there");
    }

    const bucket = lateNight
        ? "late_night"
        : morning
            ? "morning"
            : afternoon
                ? "afternoon"
                : "evening";

    const persona =
        identity.kind === "incognito"
            ? "incognito"
            : identity.kind === "named"
                ? "with_name"
                : "no_name";

    const seed = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${bucket}_${persona}`;
    return pool[hashString(seed) % pool.length];
}
