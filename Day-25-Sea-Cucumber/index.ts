console.time("Execution time");
const input: string[] = require("fs")
  .readFileSync(require("path").resolve(__dirname, "input"), "utf-8")
  .split(/\r?\n/)
  .filter(Boolean);

type SeaCucumber = [x: number, y: number];

const x = 0;
const y = 1;

const ySize = input.length;
const xSize = input[0].length;

const collisionBoard: Array<Array<SeaCucumber | null>> = new Array(xSize)
  .fill(undefined)
  .map(() => new Array(ySize).fill(null));

function canMoveEast(cucumber: SeaCucumber): boolean {
  const cucumberNewX = (cucumber[x] + 1) % xSize;
  return collisionBoard[cucumberNewX][cucumber[y]] === null;
}
function moveEast(cucumber: SeaCucumber): void {
  const cucumberNewX = (cucumber[x] + 1) % xSize;
  collisionBoard[cucumber[x]][cucumber[y]] = null;
  collisionBoard[cucumberNewX][cucumber[y]] = cucumber;
  cucumber[x] = cucumberNewX;
}
function canMoveSouth(cucumber: SeaCucumber): boolean {
  const cucumberNewY = (cucumber[y] + 1) % ySize;
  return collisionBoard[cucumber[x]][cucumberNewY] === null;
}
function moveSouth(cucumber: SeaCucumber): void {
  const cucumberNewY = (cucumber[y] + 1) % ySize;
  collisionBoard[cucumber[x]][cucumber[y]] = null;
  collisionBoard[cucumber[x]][cucumberNewY] = cucumber;
  cucumber[y] = cucumberNewY;
}

// Parse input
let xBoard, yBoard = 0;
const eastCucumbers: Array<SeaCucumber> = [];
const southCucumbers: Array<SeaCucumber> = [];
for (const line of input) {
  xBoard = 0;
  for (const char of line) {
    if (char === '>') {
      const cucumber: SeaCucumber = [xBoard, yBoard];
      eastCucumbers.push(cucumber);
      collisionBoard[xBoard][yBoard] = cucumber;
    } else if (char === 'v') {
      const cucumber: SeaCucumber = [xBoard, yBoard];
      southCucumbers.push(cucumber);
      collisionBoard[xBoard][yBoard] = cucumber;
    }
    xBoard += 1;
  }
  yBoard += 1;
}

let steps = 0;
while (true) {
  const toMoveEast = eastCucumbers.filter(canMoveEast);
  toMoveEast.forEach(moveEast);
  const toMoveSouth = southCucumbers.filter(canMoveSouth);
  toMoveSouth.forEach(moveSouth);
  steps += 1;

  if (toMoveEast.length === 0 && toMoveSouth.length === 0) break;
}

console.log(steps);

console.timeEnd("Execution time");
export {};
