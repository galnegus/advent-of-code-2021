const fs = require('fs');

const input: string[] = fs.readFileSync('freqtest', 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

interface Line {
  patterns: string[];
  outputs: string[];
}

type DigitPosition = 'top' | 'topLeft' | 'topRight' | 'middle' | 'bottomLeft' | 'bottomRight' | 'bottom';
type DigitMapping = Partial<Record<DigitPosition, string>>;
type DigitFlags = Set<DigitPosition>;
type Digit = DigitPosition[];

const digits: Record<string, Digit> = {
  0: ['top', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'bottom'],
  1: ['topRight', 'bottomRight'],
  2: ['top', 'topRight', 'middle', 'bottomLeft', 'bottom'],
  3: ['top', 'topRight', 'middle', 'bottomRight', 'bottom'],
  4: ['topLeft', 'topRight', 'middle', 'bottomRight'],
  5: ['top', 'topLeft', 'middle', 'bottomRight', 'bottom'],
  6: ['top', 'topLeft', 'middle', 'bottomLeft', 'bottomRight', 'bottom'],
  7: ['top', 'topRight', 'bottomRight'],
  8: ['top', 'topLeft', 'topRight', 'middle', 'bottomLeft', 'bottomRight', 'bottom'],
  9: ['top', 'topLeft', 'topRight', 'middle', 'bottomRight', 'bottom'],
}

const digitPositions: DigitPosition[] = [
  'top',
  'topLeft',
  'topRight',
  'middle',
  'bottomLeft',
  'bottomRight',
  'bottom',
];

function buildDigitFlags(digitMapping: DigitMapping, output: string): DigitFlags {
  const charSet = new Set(output.split(''));
  const digitFlags: DigitFlags = new Set<DigitPosition>();;
  for (const digitPosition of digitPositions) {
    if (charSet.has(digitMapping[digitPosition] as string))
      digitFlags.add(digitPosition);
  }
  return digitFlags;
}

function getDigit(digitFlags: DigitFlags): string {
  for (const digitNumber of Object.keys(digits)) {
    const digit = digits[digitNumber];
    if (digit.length === digitFlags.size && digit.every((digitPosition) => digitFlags.has(digitPosition)))
      return digitNumber;
  }
  return 'error';
}

// a - b
function charDifference(a: string, b: string): string {
  let res = a;
  for (let i = 0; i < b.length; ++i) {
    res = res.replace(b.charAt(i), '');
  }
  return res;
}

function getPatternOfLength(patterns: string[], length: number): string {
  for (const pattern of patterns) {
    if (pattern.length === length) return pattern;
  }
  return 'error';
}

function getCharFrequencies(patterns: string[]): Map<string, number> {
  const frequencies = new Map<string, number>();
  for (const pattern of patterns) {
    for (let i = 0; i < pattern.length; ++i) {
      const char = pattern.charAt(i);
      const charFrequency = frequencies.get(char);
      if (charFrequency !== undefined)
        frequencies.set(char, charFrequency + 1);
      else
        frequencies.set(char, 1);
    }
  }
  return frequencies;
}

function getCharOfFrequency(charFrequencies: Map<string, number>, targetFrequency: number): string {
  for (const [char, frequency] of charFrequencies) {
    if (frequency === targetFrequency) return char;
  }
  return 'error';
}

function buildDigitMapping(patterns: string[]): DigitMapping {
  const res: Partial<DigitMapping> = {};
  const charFrequencies = getCharFrequencies(patterns);
  const one = getPatternOfLength(patterns, 2);
  const four = getPatternOfLength(patterns, 4);
  const seven = getPatternOfLength(patterns, 3);
  const eight = getPatternOfLength(patterns, 7);
  res.top = charDifference(seven, one);
  res.topLeft = getCharOfFrequency(charFrequencies, 6);
  res.bottomLeft = getCharOfFrequency(charFrequencies, 4);
  res.bottomRight = getCharOfFrequency(charFrequencies, 9);
  res.topRight = charDifference(one, res.bottomRight);
  res.middle = charDifference(four, res.topLeft + res.topRight + res.bottomRight);
  res.bottom = charDifference(eight, res.top + res.topLeft + res.topRight + res.middle + res.bottomLeft + res.bottomRight);
  return res;
}

function parseLines(): Line[] {
  const lines = [];
  for (const line of input) {
    const [patternsStr, outputsStr] = line.split(' | ');
    lines.push({
      patterns: patternsStr.split(' '),
      outputs: outputsStr.split(' '),
    });
  }
  return lines;
}

function getOutputNumber(digitMapping: DigitMapping, outputs: string[]): number {
  let numberBuilder: string = '';
  for (const output of outputs) {
    const digitFlags = buildDigitFlags(digitMapping, output);
    const digit = getDigit(digitFlags);
    numberBuilder += digit;
  }
  return parseInt(numberBuilder, 10);
}

function partOne(): void {
  const lines = parseLines();
  let ones = 0;
  let fours = 0;
  let sevens = 0;
  let eights = 0;
  for (const line of lines) {
    for (const output of line.outputs) {
      if (output.length === 2) {
        ones++;
      } else if (output.length === 4) {
        fours++;
      } else if (output.length === 3) {
        sevens++;
      } else if (output.length === 7) {
        eights++;
      }
    }
  }
  console.log(ones + fours + sevens + eights);
}


function partTwo(): void {
  const lines = parseLines();
  const answer = lines
    .map((line) => {
      const patterns = line.patterns;
      const outputs = line.outputs;
      const digitMapping = buildDigitMapping(patterns);
      return getOutputNumber(digitMapping, outputs);
    })
    .reduce((acc, curr) => acc + curr, 0);
  console.log(answer);
}

function digitCharSumFrequencies(patterns: string[], charFrequencies: Map<string, number>): Map<string, number> {
  const res = new Map<string, number>();
  const sums = patterns.map((pattern) =>
    pattern
      .split('')
      .map((char) => charFrequencies.get(char))
      .reduce((acc, curr) => acc + curr, 0);
  )
  for (let i = 0; i < patterns.length; ++i) {
    const pattern = pattern[i];
    const freqSum = sums[i];
    res.set(pattern, freqSum);
  }
  return res;
}

function partTwoShort(): void {
  const lines = parseLines();
  const frequencies = getCharFrequencies(lines[0].patterns);
  console.log(frequencies);
}

//partOne();
//partTwo();
partTwoShort();
