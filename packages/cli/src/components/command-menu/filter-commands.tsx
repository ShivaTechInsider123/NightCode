import { COMMANDS } from "./commands";
import type { Command } from "./types";

export function getFilteredCommands(query: string): Command[] {
    if (query.length === 0) return COMMANDS

    const term = query.toLowerCase()
    return COMMANDS.filter((cmd) =>
        cmd.name.startsWith(term) ||
        cmd.value.startsWith(term) ||
        cmd.description.toLowerCase().includes(term)
    )
}

