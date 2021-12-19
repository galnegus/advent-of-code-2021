const fs = require('fs');

const input: string[] = fs.readFileSync('input', 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

function partOne(): void {
  let horizontalPosition = 0;
  let depth = 0;
  const factors: Record<string, [horizontal: number, depth: number]> = {
    'forward': [1, 0],
    'backward': [-1, 0],
    'up': [0, -1],
    'down': [0, 1],
  };
  for (const line of input) {
    const [direction, steps] = line.split(' ');
    const [horizontalFactor, depthFactor] = factors[direction];
    horizontalPosition += parseInt(steps) * horizontalFactor;
    depth += parseInt(steps) * depthFactor;
  }

  console.log(horizontalPosition * depth);
}

function partTwo(): void {
  let horizontalPosition = 0;
  let depth = 0;
  let aim = 0;
  const factors: Record<string, [direction: number, aim: number]> = {
    'forward': [1, 0],
    'backward': [-1, 0],
    'up': [0, -1],
    'down': [0, 1],
  };
  for (const line of input) {
    const [direction, steps] = line.split(' ');
    const [directionFactor, aimFactor] = factors[direction];
    horizontalPosition += parseInt(steps) * directionFactor;
    depth += parseInt(steps) * directionFactor * aim;
    aim += parseInt(steps) * aimFactor;
  }

  console.log(horizontalPosition * depth);
}

//partOne();
partTwo();
