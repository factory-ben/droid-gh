export type SupportedCommand = "review" | "heal" | "feedback" | "help";

export interface ParsedCommand {
  command: SupportedCommand;
  args: string[];
}

const mentionPattern = /@droid\b/i;

const commandAliases: Record<string, SupportedCommand> = {
  review: "review",
  heal: "heal",
  fix: "heal",
  feedback: "feedback",
  help: "help",
  "?": "help"
};

export function parseDroidCommand(body: string): ParsedCommand | null {
  if (!mentionPattern.test(body)) {
    return null;
  }

  const tokens = body
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

  const mentionIndex = tokens.findIndex((token) => mentionPattern.test(token));
  if (mentionIndex === -1) {
    return null;
  }

  const commandToken = tokens[mentionIndex + 1]
    ? tokens[mentionIndex + 1].replace(/[^\w?]/g, "").toLowerCase()
    : undefined;

  const command = commandToken && commandAliases[commandToken] ? commandAliases[commandToken] : "help";

  const args = tokens.slice(mentionIndex + 2);

  return { command, args };
}
