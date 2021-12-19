const fs = require('fs');

const input: string[] = fs.readFileSync('input', 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

type Jellyfish = number[][];
type Position = [x: number, y: number];
type StepResult = [newJellyfish: Jellyfish, flashes: number];

function parseJellyfish(): Jellyfish {
  const jellyfish: Jellyfish = [];
  for (const line of input) {
    jellyfish.push(line.split('').map((char) => parseInt(char, 10)));
  }
  return jellyfish;
}

function getAdjacentPositions([x, y]: Position): Position[] {
  return [
    [x - 1, y - 1],
    [x, y - 1],
    [x + 1, y - 1],
    [x - 1, y],
    [x + 1, y],
    [x - 1, y + 1],
    [x, y + 1],
    [x + 1, y + 1],
  ];
}

function isNotOutOfBounds([x, y]: Position): boolean {
  return x >= 0 && y >= 0 && x <= 9 && y <= 9;
}

function getPosStr([x, y]: Position): string {
  return `${x},${y}`;
}

function cloneJellyfish(jellyfish: Jellyfish): Jellyfish {
  return jellyfish.map((column) => [...column]);
}

function step(jellyfish: Jellyfish): StepResult {
  const flashed = new Map<string, Position>();
  const flashStack: Position[] = [];
  const newJellyfish: Jellyfish = cloneJellyfish(jellyfish);

  const incrementPosition = (position: Position) => {
    const [x, y] = position;
    newJellyfish[x][y] += 1;
    const posStr = getPosStr(position);
    if (newJellyfish[x][y] > 9 && !flashed.has(posStr)) {
      flashStack.push(position);
      flashed.set(posStr, position);
    }
  }

  for (let x = 0; x <= 9; ++x) {
    for (let y = 0; y <= 9; ++y) {
      incrementPosition([x, y]);
    }
  }
  while (flashStack.length > 0) {
    const flashPosition = flashStack.pop() as Position;
    const adjacentPositions = getAdjacentPositions(flashPosition)
      .filter(isNotOutOfBounds);
    for (const adjacentPosition of adjacentPositions) {
      incrementPosition(adjacentPosition);
    }
  }

  for (const [x, y] of flashed.values()) {
    newJellyfish[x][y] = 0;
  }

  return [newJellyfish, flashed.size];
}

function partOne(): void {
  let jellyfish = parseJellyfish();
  let flashes = 0;
  let flashesSum = 0;
  for (let i = 0; i < 100; ++i) {
    ([jellyfish, flashes] = step(jellyfish));
    flashesSum += flashes;
  }
  console.log(flashesSum);
}

function partTwo(): void {
  let jellyfish = parseJellyfish();
  let flashes = 0;

  const numberOfJellyfish = jellyfish
    .reduce((sum, column) =>
      sum + column.reduce((innerSum) => innerSum + 1, 0)
    , 0);

  let iter = 0;
  do {
    ([jellyfish, flashes] = step(jellyfish));
    iter++;
  } while (flashes < numberOfJellyfish && iter < 1000)
  console.log(iter);
}

//partOne();
partTwo();
