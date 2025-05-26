// lambda/prompt-builder/prompt-utils.ts

export const buildPrompt = (history: any[], currentMessage: string): string => {
  const context = history.reverse().map(entry =>
    `${entry.sender.toUpperCase()}: ${entry.message}`
  ).join('\n');

  const rules = `
Antworten Sie stets freundlich und geduldig.
Beachten Sie diese Einschränkungen: Keine persönlichen Daten, keine Kaufberatung.
  `;

  return `${context}\nUSER: ${currentMessage}\n\n${rules}`;
};

export const isPromptSafe = (prompt: string): boolean => {
  const bannedPatterns = [/jailbreak/i, /ignore.*instructions/i, /system prompt/i];
  return !bannedPatterns.some(pattern => pattern.test(prompt));
};
