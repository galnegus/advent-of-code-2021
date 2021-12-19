import Heap from 'heap-js';

const input: string[] = require('fs').readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

const board: number[][] = input.map((line) => line.split('').map(Number))
const boardWidth = board.length;
const boardHeight = board[0].length;

interface Position {
  x: number;
  y: number;
}
interface PathRisk {
  risk: number;
  position: Position;
}

function notOutOfBounds({ x, y }: Position): boolean {
  return x >= 0 && y >= 0 && x < boardWidth * 5 && y < boardHeight * 5;
}
function getMoves({ x, y }: Position): Position[] {
  const moves: Position[] = [
    { x: x - 1, y },
    { x: x + 1, y },
    { x: x, y: y - 1 },
    { x: x, y: y + 1 },
  ]
  return moves.filter(notOutOfBounds);
}
function getRisk(position: Position): number {
  return (board[position.x % boardWidth][position.y % boardHeight] + getRegionOffset(position) - 1) % 9 + 1;
}
function getPosStr({ x, y }: Position): string {
  return `${x},${y}`;
}
function isEnd({ x, y }: Position): boolean {
  return x === boardWidth * 5 - 1 && y === boardHeight * 5 - 1;
}
function getRegionOffset({ x, y }: Position): number {
  return Math.floor(x / boardWidth) + Math.floor(y / boardHeight)
}

function findPath(): number {
  const visited = new Set<string>();
  const pathRisks = new Heap<PathRisk>((a, b) => a.risk - b.risk);
  pathRisks.push({ position: { x: 0, y: 0 }, risk: 0 });

  while (pathRisks.length > 0) {
    const { position, risk } = pathRisks.pop() as PathRisk;
    if (isEnd(position)) return risk;

    const paths: PathRisk[] = getMoves(position)
      .filter((move) => !visited.has(getPosStr(move)))
      .map((move) => ({
        position: move,
        risk: risk + getRisk(move)
      }));
    for (const path of paths) {
        visited.add(getPosStr(path.position));
        pathRisks.push(path);
    }
  }

  return -1;
}

console.log(findPath());

export {}
