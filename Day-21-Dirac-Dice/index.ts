console.time("Execution time")
const input: string[] = require('fs')
  .readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

/**
 * First array index is player 1's position, value from [1, 10]
 * Second array index is player 2's position, value from [1, 10]
 * Third array index is player 1's score, value from [0, 20]
 * Fourth array index is player 2's score, value from [0, 20]
 * Value is the frequency
 */
type QuantumPlayersState = Array<Array<Array<Array<number>>>>;
interface QuantumDiceRolls {
  quantumPlayersState: QuantumPlayersState;
  wins: number;
}

let player1position = parseInt(input[0].split(': ')[1], 10);
let player2position = parseInt(input[1].split(': ')[1], 10);
let player1score = 0;
let player2score = 0;

function getTurnMoves(turn: number): number {
  return (turn * 3 - 1) * 3;
}

function getNextPosition(previousPosition: number, stepToMove: number): number {
  return ((previousPosition + stepToMove - 1) % 10) + 1;
}

function partOne(): void {
  let turn = 1;
  while (true) {
    player1position = getNextPosition(player1position, getTurnMoves(turn));
    player1score += player1position;
    if (player1score >= 1000) break;
    turn += 1;
    player2position = getNextPosition(player2position, getTurnMoves(turn));
    player2score += player2position;
    if (player2score >= 1000) break;
    turn += 1;
  }

  console.log(player1score, player2score, turn * 3);
  console.log(Math.min(player1score, player2score) * turn * 3);
}

function getEmptyQuantumPlayersState(): QuantumPlayersState {
  return new Array(11).fill(0)
    .map(() => new Array(11).fill(0)
      .map(() => new Array(21).fill(0)
        .map(() => new Array(21).fill(0))
      )
    );
}

let universeDiceRollsFreqs = new Map<number, number>();
for (let i = 1; i <= 3; ++i) {
  for (let j = 1; j <= 3; ++j) {
    for (let k = 1; k <= 3; ++k) {
      const dice = i + j + k;
      const diceFreq = universeDiceRollsFreqs.get(dice) ?? 0;
      universeDiceRollsFreqs.set(dice, diceFreq + 1);
    }
  }
}

function getNextQuantumDiceRolls(
  quantumPlayersState: QuantumPlayersState,
  player: number,
): QuantumDiceRolls {
  const nextQuantumPlayersState: QuantumPlayersState = getEmptyQuantumPlayersState();
  let wins = 0;
  for (let p1position = 1; p1position <= 10; ++p1position) {
    for (let p2position = 1; p2position <= 10; ++p2position) {
      for (let p1score = 0; p1score < 21; ++p1score) {
        for (let p2score = 0; p2score < 21; ++p2score) {
          const frequency = quantumPlayersState[p1position][p2position][p1score][p2score];
          if (frequency > 0) {
            for (const [diceRoll, diceFreq] of universeDiceRollsFreqs) {
              const newPosition = getNextPosition(player === 0 ? p1position : p2position, diceRoll);
              const newScore = (player === 0 ? p1score : p2score) + newPosition;
              const newFrequency = frequency * diceFreq;
              if (newScore >= 21) {
                wins += newFrequency;
              } else {
                if (player === 0)
                  nextQuantumPlayersState[newPosition][p2position][newScore][p2score] += newFrequency;
                else
                  nextQuantumPlayersState[p1position][newPosition][p1score][newScore] += newFrequency;
              }
            }
          }
        }
      }
    }
  }
  return {
    quantumPlayersState: nextQuantumPlayersState,
    wins,
  }
}

function partTwo(): void {
  let players: QuantumPlayersState = getEmptyQuantumPlayersState()
  let wins: number[] = [
    0,
    0,
  ];
  players[player1position][player2position][0][0] = 1;
  for (let i = 0; i < 20; ++i) {
    const playerIndex = i % 2;
    const quantumDiceRolls = getNextQuantumDiceRolls(players, playerIndex);
    players = quantumDiceRolls.quantumPlayersState;
    wins[playerIndex] += quantumDiceRolls.wins;

  }
  console.log('Most wins:', Math.max(...wins));
}

function printAnswer(part: 'one' | 'two'): void {
  if (part === 'one') partOne();
  else partTwo();
}

printAnswer('two');
console.timeEnd("Execution time");
export { }
