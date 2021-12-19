const fs = require('fs');

const input: string[] = fs.readFileSync('input', 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

type Crabs = number[];

function readCrabs(): Crabs {
  return input[0].split(',').map((str) => parseInt(str, 10));
}

// Part one
function computeFuel(crabs: Crabs, position: number): number {
  return crabs.reduce((acc, curr) => acc + Math.abs(curr - position), 0);
}

// Part two
function computeFuelHard(crabs: Crabs, position: number): number {
  const fuel = (distance: number) => distance * (distance + 1) / 2;
  return crabs.reduce((acc, curr) => acc + fuel(Math.abs(curr - position)), 0);
}

function answer(): void {
  const crabs = readCrabs();
  const avg = crabs.reduce((acc, curr) => acc + curr, 0) / crabs.length;
  const left = Math.floor(avg);
  let right = Math.ceil(avg);
  if (left === right) right = left + 1;
  const leftFuel = computeFuelHard(crabs, left);
  const rightFuel = computeFuelHard(crabs, right);
  const direction = leftFuel < rightFuel ? -1 : 1;
  let currentPosition = direction === -1 ? left : right;
  let currentFuel = computeFuelHard(crabs, currentPosition);
  let newPosition, newFuel;
  while (true) {
    newPosition = currentPosition + direction;
    newFuel = computeFuelHard(crabs, newPosition);
    if (newFuel > currentFuel) break;
    currentPosition = newPosition;
    currentFuel = newFuel;
  }
  console.log(currentFuel);
}

answer();