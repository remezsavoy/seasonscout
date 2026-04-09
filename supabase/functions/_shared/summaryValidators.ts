export type BannedPhraseRule = {
  key: string;
  phrase?: string;
  pattern?: RegExp;
};

export type BannedPhraseValidation = {
  matchedPhrases: string[];
  matchedRuleKeys: string[];
};

export { validateBannedPhrases } from './summaryValidators.js';
