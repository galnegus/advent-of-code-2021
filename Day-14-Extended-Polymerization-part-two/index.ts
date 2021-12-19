const input: string[] = require('fs').readFileSync('input', 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);
let template: string = input[0];
const rules: Map<string, string> =
  new Map(
    input.slice(1, input.length).map((line) => line.split(' -> ') as [string, string])
  );
let ruleFrequencies = new Map<string, number>();
for (let i = 0; i < template.length - 1; ++i) { 
  const rule = template.slice(i, i + 2);
  const ruleFreq = ruleFrequencies.get(rule) ?? 0;
  ruleFrequencies.set(rule, ruleFreq + 1);
}

function applyRules(ruleFrequencies: Map<string, number>, rules: Map<string, string>): Map<string, number> {
  const newRuleFrequencies = new Map<string, number>();

  for (const [rule, frequency] of ruleFrequencies) {
    const toInsert = rules.get(rule);
    const rule1 = rule.charAt(0) + toInsert;
    const rule2 = toInsert + rule.charAt(1);
    const ruleFreq = ruleFrequencies.get(rule) ?? 0;
    const newRule1Freq = newRuleFrequencies.get(rule1) ?? 0;
    const newRule2Freq = newRuleFrequencies.get(rule2) ?? 0;
    newRuleFrequencies.set(rule1, ruleFreq + newRule1Freq);
    newRuleFrequencies.set(rule2, ruleFreq + newRule2Freq);
  }

  return newRuleFrequencies;
}

for (let i = 0; i < 40; ++i) {
  ruleFrequencies = applyRules(ruleFrequencies, rules);
}

const charFrequencyMap = new Map<string, number>();
charFrequencyMap.set(template.charAt(0), 0.5);
charFrequencyMap.set(template.charAt(template.length - 1), 0.5);
for (const [rule, frequency] of ruleFrequencies) {
  const char1 = rule.charAt(0);
  const char1Freq = charFrequencyMap.get(char1) ?? 0;
  const char2 = rule.charAt(1);
  const char2Freq = charFrequencyMap.get(char2) ?? 0;
  if (char1 === char2) {
    charFrequencyMap.set(char1, char1Freq + frequency);
  } else {
    charFrequencyMap.set(char1, char1Freq + frequency * 0.5);
    charFrequencyMap.set(char2, char2Freq + frequency * 0.5);
  }
}
const charFrequencies: [string, number][] = [...charFrequencyMap.entries()];
charFrequencies.sort((a, b) => b[1] - a[1]);
console.log(charFrequencies[0][1] - charFrequencies[charFrequencies.length - 1][1]);
