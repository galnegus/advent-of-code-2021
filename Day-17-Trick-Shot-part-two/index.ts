const input: string[] = require('fs').readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

interface Interval {
  min: number;
  max: number;
}
interface TargetArea {
  x: Interval;
  y: Interval;
}
interface Candidate {
  velocity: number;
  steps: number;
}

const targetInput = input[0]
  .split('target area: ')[1]
  .split(', ')
  .map((axisInput) => axisInput.split('=')[1])
  .map((axisInterval): Interval => {
    const interval = axisInterval.split('..');
    return {
      min: parseInt(interval[0], 10),
      max: parseInt(interval[1], 10),
    };
  });
const targetArea: TargetArea = {
  x: targetInput[0],
  y: targetInput[1],
};

function solveY(y: number, n: number): number {
  return (y + 1) * n - n * (n + 1) / 2;
}

function solveX(x: number, n: number): number {
  if (n > x)
    return (x + 1) * x - x * (x + 1) / 2
  else
    return (x + 1) * n - n * (n + 1) / 2;
}

/**
 * The y trajectory is described by the equation:
 * (y + 1) * n - n(n + 1) / 2
 * 
 * https://www.wolframalpha.com/input/?i=%28c+%2B+1%29x-x%28x%2B1%29%2F2%3Dd
 * (solve for x)
 */
function solveYSteps(y: number, target: number): number {
  // https://www.wolframalpha.com/input/?i=1%2F2+%281+%2B+2+c+%2B+sqrt%281+%2B+4+c+%2B+4+c%5E2+-+8+d%29%29&assumption=%22ClashPrefs%22+-%3E+%7B%22Math%22%7D
  return (1 / 2) * (Math.sqrt(4 * y ** 2 + 4 * y - 8 * target + 1) + 2 * y + 1);
}

function solveXSteps(x: number, target: number): number {
  // https://www.wolframalpha.com/input/?i=1%2F2+%281+%2B+2+c+-+sqrt%281+%2B+4+c+%2B+4+c%5E2+-+8+d%29%29&assumption=%22ClashPrefs%22+-%3E+%7B%22Math%22%7D
  return (1 / 2) * (-Math.sqrt(4 * x ** 2 + 4 * x - 8 * target + 1) + 2 * x + 1);
}

function getYStep(y: number, step: number): number {
  return (y + 1) - step;
}
function getXStep(x: number, step: number): number {
  if (step > x) return 0;
  return (x + 1) - step;
}

/**
 * Same for x and y
 */
function solveMaxPosition(velocity: number): number {
  // https://www.wolframalpha.com/input/?i=%28n+%2B+1%29+*+n+-+n%28n%2B1%29%2F2
  return velocity * (velocity + 1) / 2;
}

function getXCandidates(x: number, xInterval: Interval, maxedXCandidates: Candidate[]): Candidate[] {
  const candidates: Candidate[] = [];
  const stepsAtMin = solveXSteps(x, xInterval.min);
  let steps = Math.floor(stepsAtMin);
  let xAtStep = solveX(x, steps);
  if (Number.isInteger(stepsAtMin)) {
    candidates.push({ velocity: x, steps: stepsAtMin });
  }
  while (true) {
    steps++;
    xAtStep += getXStep(x, steps);
    if (xAtStep <= xInterval.max && steps <= x) {
      if (steps === x) {
        maxedXCandidates.push({ velocity: x, steps });
      }
      candidates.push({ velocity: x, steps });
    } else {
      break;
    }
  }
  return candidates;
}

function getYCandidates(y: number, xInterval: Interval): Candidate[] {
  const candidates: Candidate[] = [];
  const stepsAtMax = solveYSteps(y, xInterval.max);
  let steps = Math.floor(stepsAtMax);
  let yAtStep = solveY(y, steps);
  if (Number.isInteger(stepsAtMax)) {
    candidates.push({ velocity: y, steps: stepsAtMax });
  }
  while (true) {
    steps++;
    yAtStep += getYStep(y, steps);
    if (yAtStep >= xInterval.min) {
      candidates.push({ velocity: y, steps });
    } else {
      break;
    }
  }
  return candidates;
}

// Candidates are maps of (number of) steps -> candidate
const xCandidates = new Map<number, Candidate[]>();
let maxedXCandidates: Candidate[] = [];
const yCandidates = new Map<number, Candidate[]>();
for (let x = 0; x <= targetArea.x.max; ++x) {
  for (const candidate of getXCandidates(x, targetArea.x, maxedXCandidates)) {
    const stepCandidates = xCandidates.get(candidate.steps) ?? [];
    xCandidates.set(candidate.steps, [...stepCandidates, candidate]);
  }
}
for (let y = targetArea.y.min; y <= Math.abs(targetArea.y.min); ++y) {
  for (const candidate of getYCandidates(y, targetArea.y)) {
    const stepCandidates = yCandidates.get(candidate.steps) ?? [];
    yCandidates.set(candidate.steps, [...stepCandidates, candidate]);
  }
}

let xyCombinations = 0;
const meetsCritera: string[] = [];
for (const stepsToCheck of yCandidates.keys()) {
  const yStepsLength = yCandidates.get(stepsToCheck)?.length ?? 0;
  const xStepsLength = xCandidates.get(stepsToCheck)?.length ?? 0;
  xyCombinations += yStepsLength * xStepsLength;

  for (const yCandidate of yCandidates.get(stepsToCheck) ?? []) {
    for (const xCandidate of (xCandidates.get(stepsToCheck) ?? []).reverse()) {
      meetsCritera.push(`${xCandidate.velocity},${yCandidate.velocity}`);
    }
    for (const maxedXCandidate of maxedXCandidates) {
      if (maxedXCandidate.steps < stepsToCheck) {
        xyCombinations += 1;
        meetsCritera.push(`${maxedXCandidate.velocity},${yCandidate.velocity}`);
      }
    }
  }
}
//console.log(meetsCritera);
//console.log(xyCombinations);
console.log((new Set<string>(meetsCritera)).size);

export {}
