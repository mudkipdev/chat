declare global {
    namespace App {
        interface Locals {
            user: {
                id: string;
                username: string;
                displayName: string;
                admin: boolean;
            } | null;
        }
    }
}

export {};
