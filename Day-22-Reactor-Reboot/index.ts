/**
 * Takes about ~15 seconds on my computer to find answer.
 * I will optimize this a bit later, one big optimization that could be done is to merge cuboids after splitting (where possible)
 * As it stands I'm thinking the number of cuboids increase exponentially, this could be mitigating I believe (maybe linearly instead?)
 */
console.time("Execution time")
const input: string[] = require('fs')
  .readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

type RebootInstruction = [number, number];
interface Cuboid {
  xRange: [number, number];
  yRange: [number, number];
  zRange: [number, number];
}
interface RebootStep extends Cuboid {
  active: boolean;
};
type Axis = 'x' | 'y' | 'z';
interface AxisIntersection {
  axis: Axis;
  value: number;
}

const rebootSteps = input
  .map((line) => {
    const parsedRanges = line.split(',')
      .map((substr) => substr
        .split('=')[1].split('..').map(Number)
      );
    const active = line.startsWith('on');
    return {
      active,
      xRange: parsedRanges[0],
      yRange: parsedRanges[1],
      zRange: parsedRanges[2],
    }
  }) as unknown as RebootStep[];

function partOne(): void {
  const activeCubes = new Set<string>();

  for (const { active, xRange, yRange, zRange } of rebootSteps) {
    if (Math.abs(xRange[0]) > 50 || Math.abs(yRange[0]) > 50 || Math.abs(zRange[0]) > 50 || Math.abs(xRange[1]) > 50 || Math.abs(yRange[1]) > 50 || Math.abs(zRange[1]) > 50) continue;
    for (let x = xRange[0]; x <= xRange[1]; ++x) {
      for (let y = yRange[0]; y <= yRange[1]; ++y) {
        for (let z = zRange[0]; z <= zRange[1]; ++z) {
          const cubeStr = `${x},${y},${z}`;
          if (active)
            activeCubes.add(cubeStr);
          else
            activeCubes.delete(cubeStr);
        }
      }
    }
  }
  console.log(activeCubes.size);
}

function partTwo(): void {
  const existingCuboids: RebootStep[] = [];
  let cuboids: Cuboid[] = [];
  for (const rebootStep of rebootSteps) {
    cuboids = iterate(rebootStep, cuboids);
  }
  const volumeSum = cuboids.reduce((sum, cuboid) => sum + cuboidVolume(cuboid), 0);
  console.log(volumeSum);
}

function cuboidVolume({ xRange, yRange, zRange }: Cuboid): number {
  return (xRange[1] - xRange[0] + 1) * (yRange[1] - yRange[0] + 1) * (zRange[1] - zRange[0] + 1)
}

function iterate(rebootStep: RebootStep, cuboids: Cuboid[]): Cuboid[] {
  if (cuboids.length === 0 && rebootStep.active) {
    return [rebootStep];
  }

  let rebootStepFragments: Cuboid[] = [rebootStep];
  const newCuboids: Cuboid[] = [];
  for (const cuboid of cuboids) {
    let cuboidWasChanged = false;
    const newRebootStepFragments: Cuboid[] = [];
    if (rebootStepFragments.length === 0) newCuboids.push(cuboid);
    for (const rebootStepFragment of rebootStepFragments) {
      if (intersects(rebootStep, cuboid)) {
        if (rebootStep.active) {
          for (const newRebootStepFragment of splitCuboid(rebootStepFragment, cuboid)) {
            if (!intersects(newRebootStepFragment, cuboid)) {
              newRebootStepFragments.push(newRebootStepFragment);
            }
          }
        } else {
          cuboidWasChanged = true;
          for (const newCuboidFragment of splitCuboid(cuboid, rebootStepFragment)) {
            if (!intersects(newCuboidFragment, rebootStepFragment)) {
              newCuboids.push(newCuboidFragment);
            }
          }
          newRebootStepFragments.push(rebootStepFragment);
        }
      } else {
        newRebootStepFragments.push(rebootStepFragment);
      }
    }
    if (!cuboidWasChanged && rebootStepFragments.length !== 0)
      newCuboids.push(cuboid);
    rebootStepFragments = newRebootStepFragments;
  }
  newCuboids.push(...rebootStepFragments.filter((cuboid) => (cuboid as RebootStep)?.active !== false));
  return newCuboids;
}


function axisIntersects(aAxisRange: [number, number], bAxisRange: [number, number]): boolean {
  return (aAxisRange[1] >= bAxisRange[0] && aAxisRange[0] <= bAxisRange[1]);
}

function intersects(aCuboid: Cuboid, bCuboid: Cuboid): boolean {
  return axisIntersects(aCuboid.xRange, bCuboid.xRange)
    && axisIntersects(aCuboid.yRange, bCuboid.yRange)
    && axisIntersects(aCuboid.zRange, bCuboid.zRange);
}

function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * This needs to be refactored
 */
function splitCuboid(cuboid1: Cuboid, cuboid2: Cuboid): Cuboid[] {
  const newCuboids: Cuboid[] = [];
  const xSplits: number[] = [];
  const ySplits: number[] = [];
  const zSplits: number[] = [];

  if (cuboid2.xRange[0] !== cuboid1.xRange[0])
    xSplits.push(cuboid1.xRange[0]);
  if (cuboid2.yRange[0] !== cuboid1.yRange[0])
    ySplits.push(cuboid1.yRange[0]);
  if (cuboid2.zRange[0] !== cuboid1.zRange[0])
    zSplits.push(cuboid1.zRange[0]);

  if (isInRange(cuboid2.xRange[0], ...cuboid1.xRange)) {
    if (cuboid2.xRange[0] !== cuboid1.xRange[0])
      xSplits.push(cuboid2.xRange[0] - 1);
    xSplits.push(cuboid2.xRange[0]);
  }
  if (isInRange(cuboid2.xRange[1], ...cuboid1.xRange)) {
    xSplits.push(cuboid2.xRange[1]);
    if (cuboid2.xRange[1] !== cuboid1.xRange[1])
      xSplits.push(cuboid2.xRange[1] + 1);
  }
  if (isInRange(cuboid2.yRange[0], ...cuboid1.yRange)) {
    if (cuboid2.yRange[0] !== cuboid1.yRange[0])
      ySplits.push(cuboid2.yRange[0] - 1);
    ySplits.push(cuboid2.yRange[0]);
  }
  if (isInRange(cuboid2.yRange[1], ...cuboid1.yRange)) {
    ySplits.push(cuboid2.yRange[1]);
    if (cuboid2.yRange[1] !== cuboid1.yRange[1])
      ySplits.push(cuboid2.yRange[1] + 1);
  }
  if (isInRange(cuboid2.zRange[0], ...cuboid1.zRange)) {
    if (cuboid2.zRange[0] !== cuboid1.zRange[0])
      zSplits.push(cuboid2.zRange[0] - 1);
    zSplits.push(cuboid2.zRange[0]);
  }
  if (isInRange(cuboid2.zRange[1], ...cuboid1.zRange)) {
    zSplits.push(cuboid2.zRange[1]);
    if (cuboid2.zRange[1] !== cuboid1.zRange[1])
      zSplits.push(cuboid2.zRange[1] + 1);
  }

  if (cuboid2.xRange[1] !== cuboid1.xRange[1])
    xSplits.push(cuboid1.xRange[1]);
  if (cuboid2.yRange[1] !== cuboid1.yRange[1])
    ySplits.push(cuboid1.yRange[1]);
  if (cuboid2.zRange[1] !== cuboid1.zRange[1])
    zSplits.push(cuboid1.zRange[1]);
  for (let xIndex = 0; xIndex < xSplits.length; xIndex += 2) {
    for (let yIndex = 0; yIndex < ySplits.length; yIndex += 2) {
      for (let zIndex = 0; zIndex < zSplits.length; zIndex += 2) {
        newCuboids.push({
          xRange: [xSplits[xIndex], xSplits[xIndex + 1]],
          yRange: [ySplits[yIndex], ySplits[yIndex + 1]],
          zRange: [zSplits[zIndex], zSplits[zIndex + 1]],
        })
      }
    }
  }
  return newCuboids;
}

function testSplits(): void {
  const splitCuboids = splitCuboid(
    {
      xRange: [0, 1],
      yRange: [0, 10],
      zRange: [0, 10],
    },
    {
      xRange: [0, 1],
      yRange: [20, 30],
      zRange: [20, 30],
    },
  );
  console.log(JSON.stringify(splitCuboids));
}




//partOne();
//testSplits();
partTwo();

console.timeEnd("Execution time");
export { };
