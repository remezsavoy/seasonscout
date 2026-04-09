function normalizeForComparison(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function validateBannedPhrases(text, rules) {
  const normalizedText = normalizeForComparison(text);
  const matchedPhrases = [];
  const matchedRuleKeys = [];

  for (const rule of rules) {
    const phrase = rule.phrase ? normalizeForComparison(rule.phrase) : null;
    const matched = phrase
      ? normalizedText.includes(phrase)
      : rule.pattern
        ? rule.pattern.test(text)
        : false;

    if (matched) {
      matchedRuleKeys.push(rule.key);
      matchedPhrases.push(rule.phrase ?? rule.pattern?.source ?? rule.key);
    }
  }

  return {
    matchedPhrases,
    matchedRuleKeys,
  };
}
