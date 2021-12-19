const fs = require('fs');

const input: string[] = fs.readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

class Position {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  str(): string {
    return `${this.x},${this.y}`;
  }
}
interface Line {
  start: Position;
  end: Position;
}

function parsePosition(str: string): Position {
  const [x, y] = str.split(',').map((posStr) => parseInt(posStr, 10));
  return new Position(x, y);
}
function readLines(): Line[] {
  const lines = [];
  for (const line of input) {
    const split = line.split(' -> ');
    lines.push({
      start: parsePosition(split[0]),
      end: parsePosition(split[1]),
    })
  }
  return lines;
}
function forEachPosition(line: Line, callback: (position: Position) => void): void {
  // Horizontal
  if (line.start.y === line.end.y) {
    const direction = line.start.x < line.end.x ? 1 : -1;
    const steps = Math.abs(line.end.x - line.start.x);
    for (let i = 0; i <= steps ; ++i) {
      callback(new Position(
        line.start.x + i * direction,
        line.start.y,
      ));
    }
  }
  // Vertical
  if (line.start.x === line.end.x) {
    const direction = line.start.y < line.end.y ? 1 : -1;
    const steps = Math.abs(line.end.y - line.start.y);
    for (let i = 0; i <= steps ; ++i) {
      callback(new Position(
        line.start.x,
        line.start.y + i * direction,
      ));
    }
  }
  // Diagonal, only part two!!
  if (Math.abs(line.start.x - line.end.x) === Math.abs(line.start.y - line.end.y)) {
    const xDirection = line.start.x < line.end.x ? 1 : -1;
    const yDirection = line.start.y < line.end.y ? 1 : -1;
    const steps = Math.abs(line.end.y - line.start.y);
    for (let i = 0; i <= steps ; ++i) {
      callback(new Position(
        line.start.x + i * xDirection,
        line.start.y + i * yDirection,
      ));
    }
  }
}

function answer(): void {
  const lines = readLines();
  const thermalCount = new Map<string, number>();
  for (const line of lines) {
    forEachPosition(line, (position) => {
      const positionString = position.str();
      if (thermalCount.has(positionString)) {
        const count = thermalCount.get(positionString) ?? 0;
        thermalCount.set(positionString, count + 1);
      } else {
        thermalCount.set(positionString, 1);
      }
    });
  }
  let twoOrMoreOverlaps = 0;
  for (const [position, count] of thermalCount) {
    if (count >= 2) {
      twoOrMoreOverlaps += 1;
    }
  }
  console.log(twoOrMoreOverlaps);
}

answer();

export {}
