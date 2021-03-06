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

function yIsInInterval(y: number, yInterval: Interval): boolean {
  const stepsAtMin = solveYSteps(y, yInterval.min);
  const stepsAtMax = solveYSteps(y, yInterval.max);
  return Math.floor(stepsAtMin) !== Math.floor(stepsAtMax) || Number.isInteger(stepsAtMin) || Number.isInteger(stepsAtMax);
}

function xIsInInterval(x: number, xInterval: Interval): boolean {
  const stepsAtMin = solveYSteps(x, xInterval.min);
  const stepsAtMax = solveYSteps(x, xInterval.max);
  const maxPosition = solveMaxPosition(x);
  return (maxPosition >= xInterval.min && Math.floor(stepsAtMin) !== Math.floor(stepsAtMax))
    || (maxPosition >= xInterval.min && maxPosition <= xInterval.max);
}

function getXMaxPositionStart(x: number, xInterval: Interval): number {
  const maxPosition = solveMaxPosition(x);
  if (maxPosition >= xInterval.min && maxPosition <= xInterval.max)
    return maxPosition;
  else
    return -1;
}

function getXCandidates(x: number, xInterval: Interval, stepsSet: Set<number>, maxedXCandidates: Candidate[]): Candidate[] {
  const candidates: Candidate[] = [];
  const stepsAtMin = solveXSteps(x, xInterval.min);
  let steps = Math.floor(stepsAtMin);
  let xAtStep = solveX(x, steps);
  if (Number.isInteger(stepsAtMin)) {
    stepsSet.add(stepsAtMin);
    candidates.push({ velocity: x, steps: stepsAtMin });
  }
  while (true) {
    steps++;
    xAtStep += getXStep(x, steps);
    if (xAtStep <= xInterval.max && steps <= x) {
      if (steps === x) {
        maxedXCandidates.push({ velocity: x, steps });
      }
      if (!stepsSet.has(steps)) {
        stepsSet.add(steps);
        candidates.push({ velocity: x, steps });
      }
    } else {
      break;
    }
  }
  return candidates;
}

function getYCandidates(y: number, xInterval: Interval, stepsSet: Set<number>): Candidate[] {
  const candidates: Candidate[] = [];
  const stepsAtMax = solveYSteps(y, xInterval.max);
  let steps = Math.floor(stepsAtMax);
  let yAtStep = solveY(y, steps);
  if (Number.isInteger(stepsAtMax)) {
    stepsSet.add(stepsAtMax);
    candidates.push({ velocity: y, steps: stepsAtMax });
  }
  while (true) {
    steps++;
    yAtStep += getYStep(y, steps);
    if (yAtStep >= xInterval.min && !stepsSet.has(steps)) {
      stepsSet.add(steps);
      candidates.push({ velocity: y, steps });
    } else {
      break;
    }
  }
  return candidates;
}

const xCandidates: Candidate[] = [];
let maxedXCandidates: Candidate[] = [];
const yCandidates: Candidate[] = [];
const xStepsSet = new Set<number>();
const yStepsSet = new Set<number>();
for (let x = 1; x < targetArea.x.max; ++x) {
  xCandidates.push(...getXCandidates(x, targetArea.x, xStepsSet, maxedXCandidates));
}
for (let y = 1; y < Math.abs(targetArea.y.min); ++y) {
  yCandidates.push(...getYCandidates(y, targetArea.y, yStepsSet));
}
for (const yCandidate of yCandidates.reverse()) {
  if(maxedXCandidates.some((maxedX) => maxedX.steps < yCandidate.steps) ||
    xCandidates.some((xCandidate) => xCandidate.steps === yCandidate.steps)) {
    console.log(yCandidate.velocity, yCandidate.steps, solveMaxPosition(yCandidate.velocity));
    break;
  }
}
console.log('end');

export {}
