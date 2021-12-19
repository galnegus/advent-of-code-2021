const fs = require('fs');

const input: string[] = fs.readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

const opensChunk = new Set<string>(['(', '[', '{', '<']);
const closesChunk = new Set<string>([')', ']', '}', '>']);
const opens: Record<string, string> = {
  ')': '(',
  ']': '[',
  '}': '{',
  '>': '<',
};
const errorScore: Record<string, number> = {
  ')': 3,
  ']': 57,
  '}': 1197,
  '>': 25137,
};
const completionScore: Record<string, number> = {
  '(': 1,
  '[': 2,
  '{': 3,
  '<': 4,
};

function partOne(): void {
  let errorScoreSum = 0;
  let index = 0;
  for (const line of input) {
    const chunkStack = [];
    let firstError = true;
    for (let i = 0; i < line.length; ++i) {
      const char = line.charAt(i);
      if (opensChunk.has(char)) {
        chunkStack.push(char);
      }
      else if (closesChunk.has(char)) {
        if (chunkStack.pop() !== opens[char] && firstError) {
          firstError = false;
          errorScoreSum += errorScore[char];
        }
      }
    }
    ++index;
  }
  console.log(errorScoreSum);
}

function partTwo(): void {
  let errorScoreSum = 0;
  let index = 0;
  let completionScores: number[] = [];
  for (const line of input) {
    const chunkStack = [];
    let lineHasErrors = false;
    for (let i = 0; i < line.length; ++i) {
      const char = line.charAt(i);
      if (opensChunk.has(char)) {
        chunkStack.push(char);
      }
      else if (closesChunk.has(char)) {
        if (chunkStack.pop() !== opens[char] && !lineHasErrors) {
          lineHasErrors = true;
        }
      }
    }
    if (!lineHasErrors && chunkStack.length > 0) {
      let completionScoreSum: number = 0;
      while (chunkStack.length > 0) {
        const char = chunkStack.pop() as string;
        completionScoreSum = completionScoreSum * 5 + 
        completionScore[char];
        //console.log(char, completionScore[char], completionScoreSum);
      }
      completionScores.push(completionScoreSum);
    }
    ++index;
  }
  completionScores.sort((a, b) => b - a);
  console.log(completionScores[Math.floor(completionScores.length / 2)]);
}

partTwo();

export {}
