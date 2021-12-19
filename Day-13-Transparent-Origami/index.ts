const fs = require('fs');

interface Paper {
  positions: Position[];
  size: Position;
}
interface Position {
  x: number, y: number;
}
type FoldAxis = 'x' | 'y';
interface FoldInstruction {
  foldAxis: FoldAxis;
  foldPosition: number;
}

const input: string[] = fs.readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);
const positions: Position[] = input
  .filter((line) => !line.startsWith('f'))
  .map((line) => line
    .split(',')
    .map((value) => parseInt(value, 10)))
  .map(([x, y]) => ({ x, y }));
const paper: Paper = {
  positions,
  size: {
    x: Math.max(...positions.map(({ x }) => x)),
    y: Math.max(...positions.map(({ y }) => y)),
  }
}
const foldInstructions: FoldInstruction[] = input
  .filter((line) => line.startsWith('f'))
  .map((line) => line.split('fold along ')[1])
  .map((foldValues) => {
    const split = foldValues.split('=');
    return {
      foldAxis: split[0],
      foldPosition: parseInt(split[1], 10),
    } as FoldInstruction;
  });

function getPosStr({ x, y }: Position): string {
  return `${x},${y}`;
}
function getPosition(posStr: string): Position {
  const [x, y] = posStr
    .split(',')
    .map((value) => parseInt(value, 10));
  return { x, y };
}

function foldMap({ foldAxis, foldPosition }: FoldInstruction, size: Position): (position: Position) => Position {
  return ({ x, y }) => {
    if (foldAxis === 'x') {
      return { x: 2 * foldPosition - x, y };
    } else {
      return { x, y: 2 * foldPosition - y };
    }
  }
}

function fold(
  { positions, size }: Paper,
  { foldAxis, foldPosition }: FoldInstruction,
): Paper {
  const positionSet = new Set<string>();

  const addToSet = (position: Position) => positionSet.add(getPosStr(position));

  const unfoldedSize = foldPosition;
  const foldedSize = size[foldAxis] - foldPosition;

  const unfoldedOffset = foldedSize > unfoldedSize ? foldedSize - unfoldedSize : 0;
  positions
    .filter((position) => position[foldAxis] < foldPosition)
    .map((position) => ({
      ...position,
      [position[foldAxis]]: position[foldAxis] + unfoldedOffset,
    }))
    .forEach(addToSet);

  positions
    .filter((position) => position[foldAxis] > foldPosition)
    .map(foldMap({ foldAxis, foldPosition }, size))
    .forEach(addToSet);

  const newPositions = [...positionSet].map(getPosition);
  const newSize = { ...size, [foldAxis]: foldPosition };
  return {
    positions: newPositions,
    size: newSize,
  };
}


function print({ positions, size }: Paper): void {
  const grid: string[][] = [];
  for (let y = 0; y < size.y; ++y) {
    grid.push([]);
    for (let x = 0; x < size.x; ++x) {
      grid[y][x] = '.';
    }
  }

  for (const { x, y } of positions) {
    grid[y][x] = '#';
  }

  for (let y = 0; y < size.y; ++y) {
    let str = '';
    for (let x = 0; x < size.x; ++x) {
      str += grid[y][x];
    }
    console.log(str);
  }
}

//const partOne = fold(positions, foldInstructions[0]);
//console.log(partOne);

let foldedPaper = paper;
for (const foldInstruction of foldInstructions) {
  foldedPaper = fold(foldedPaper, foldInstruction);
}

print(foldedPaper);

export {}
