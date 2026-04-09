import { heroImageQueryPrompt } from './prompts/heroImageQueryPrompt.ts';

export type PromptAsset = {
  fileName: string;
  systemInstruction: string;
  userTemplate: string;
};

function parsePromptSections(rawPrompt: string, fileName: string) {
  const systemIndex = rawPrompt.indexOf('SYSTEM PROMPT:');
  const userIndex = rawPrompt.indexOf('USER PROMPT:');

  if (systemIndex === -1 || userIndex === -1 || userIndex <= systemIndex) {
    throw new Error(`Prompt file ${fileName} is missing SYSTEM PROMPT or USER PROMPT sections.`);
  }

  return {
    systemInstruction: rawPrompt
      .slice(systemIndex + 'SYSTEM PROMPT:'.length, userIndex)
      .replace(/\n---\s*$/m, '')
      .trim(),
    userTemplate: rawPrompt
      .slice(userIndex + 'USER PROMPT:'.length)
      .trim(),
  };
}

function loadPromptAsset(fileName: string, content: string): PromptAsset {
  const parsed = parsePromptSections(content, fileName);

  return {
    fileName,
    systemInstruction: parsed.systemInstruction,
    userTemplate: parsed.userTemplate,
  };
}

export function renderPromptTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\{([a-z_]+)\}/gi, (fullMatch, variableName) => {
    const replacement = variables[variableName];
    return replacement === undefined ? fullMatch : replacement;
  });
}

export function loadEditorialPromptAssets() {
  const heroStrategy = loadPromptAsset('heroImageQueryPrompt.ts', heroImageQueryPrompt);

  return {
    heroStrategy,
  };
}
