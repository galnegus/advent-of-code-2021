const input: string[] = require('fs').readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);
let template: string = input[0];
const rules: Map<string, string> =
  new Map(
    input.slice(1, input.length).map((line) => line.split(' -> ') as [string, string])
  );

interface RuleToApply {
  rule: [string, string];
  index: number;
}

function indicesOf(searchStr: string, str: string) {
    var startIndex = 0, index, indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + 1;
    }
    return indices;
}

function applyRules(template: string, rules: Map<string, string>): string {
  const rulesToApply: RuleToApply[] = [];
  for (const rule of rules) {
    const [substring, toInsert] = rule;
    for (const matchIndex of indicesOf(substring, template)) {
      rulesToApply.push({ rule, index: matchIndex + 1, });
    }
  }
  rulesToApply.sort((a, b) => a.index - b.index);
  let newTemplate = template;
  let offset = 0;
  for (const { rule: [_, toInsert], index } of rulesToApply) {
    newTemplate = newTemplate.slice(0, index + offset) + toInsert + newTemplate.slice(index + offset);
    ++offset;
  }

  return newTemplate;
}

for (let i = 0; i < 10; ++i) {
  template = applyRules(template, rules);
}

const charFrequencyMap = new Map<string, number>();
for (let i = 0; i < template.length; ++i) {
  const char = template.charAt(i);
  const frequency = charFrequencyMap.get(char) ?? 0;
  charFrequencyMap.set(char, frequency + 1);
}
const charFrequencies: [string, number][] = [...charFrequencyMap.entries()];
charFrequencies.sort((a, b) => b[1] - a[1]);
console.log(charFrequencies[0][1] - charFrequencies[charFrequencies.length - 1][1]);

export {}
