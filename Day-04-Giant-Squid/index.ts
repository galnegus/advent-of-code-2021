const fs = require('fs');

const input: string[] = fs.readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

type BingoRow = number[];
type BingoBoard = BingoRow[];

function readBoards(): BingoBoard[] {
  const boards: BingoBoard[] = [];
  for (let i = 1; i < input.length; ++i) {
    const boardRowIndex = (i - 1) % 5;
    let board: BingoBoard;
    if (boardRowIndex === 0) {
      board = [];
      boards.push(board);
    } else {
      board = boards[boards.length - 1];
    }
    const boardRow = input[i]
      .split(/ +/)
      .filter(Boolean)
      .map((str) => parseInt(str, 10));
    board.push(boardRow);
  }
  return boards;
}

function rowHasBingo(board: BingoBoard, rowIndex: number, numbers: Set<number>): boolean {
  for (let i = 0; i < 5; ++i) {
    if (!numbers.has(board[rowIndex][i])) return false;
  }
  return true;
}
function columnHasBingo(board: BingoBoard, columnIndex: number, numbers: Set<number>): boolean {
  for (let i = 0; i < 5; ++i) {
    if (!numbers.has(board[i][columnIndex])) return false;
  }
  return true;

  // cutie loves bunny
}

function boardHasBingo(board: BingoBoard, numbers: Set<number>): boolean {
  for (let i = 0; i < 5; ++i) {
    if (rowHasBingo(board, i, numbers) || columnHasBingo(board, i, numbers)) return true;
  }
  return false;
}

function score(board: BingoBoard, numbers: Set<number>, winningNumber: number): number {
  let unmarkedSum = 0;
  for (let i = 0; i < 5; ++i) {
    for (let j = 0; j < 5; ++j) {
      const boardNumber = board[i][j];
      if (!numbers.has(boardNumber)) unmarkedSum += boardNumber;
    }
  }
  return unmarkedSum * winningNumber;
}

function partOne(): void {
  const winningNumbers = input[0].split(',').map((str) => parseInt(str, 10));
  const boards = readBoards();

  const numbersSoFar = new Set<number>();
  for (const nextNumber of winningNumbers) {
    numbersSoFar.add(nextNumber);
    for (const board of boards) {
      if (boardHasBingo(board, numbersSoFar)) {
        console.log(score(board, numbersSoFar, nextNumber));
        return;
      }
    }
  }
}

function partTwo(): void {
  const winningNumbers = input[0].split(',').map((str) => parseInt(str, 10));
  const boards = new Set<BingoBoard>(readBoards());

  const numbersSoFar = new Set<number>();
  for (const nextNumber of winningNumbers) {
    numbersSoFar.add(nextNumber);
    for (const board of boards) {
      if (boardHasBingo(board, numbersSoFar)) {
        if (boards.size > 1) {
          boards.delete(board);
        } else {
          console.log(score(board, numbersSoFar, nextNumber));
          return;
        }
      }
    }
  }
}

//partOne();
partTwo();

export {}
