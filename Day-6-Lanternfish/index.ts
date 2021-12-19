const fs = require('fs');

const input: string[] = fs.readFileSync('input', 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

function readInitialFish(): number[] {
  return input[0].split(',').map((str) => parseInt(str, 10));
}

function advanceDay(fishes: number[]): number[] {
  const newFish: number[] = [];
  for (const fish of fishes) {
    if (fish === 0) {
      newFish.push(6, 8);
    } else {
      newFish.push(fish - 1);
    }
  }
  return newFish;
}

function advanceDays(fishes: number[], days: number): number {
  let fishCount = new Array(9).fill(0);
  for (const fish of fishes) {
    fishCount[fish]++;
  }

  for (let i = 0; i < days; ++i) {
    const newFishCount = new Array(9).fill(0);
    for (let fishIndex = 0; fishIndex < 9; ++fishIndex) {
      const count = fishCount[fishIndex];
      if (fishIndex === 0 && count > 0) {
        newFishCount[6] += count;
        newFishCount[8] += count;
      } else if (fishIndex > 0) {
        newFishCount[fishIndex - 1] += count;
      }
    }
    fishCount = newFishCount;
  }
  return fishCount.reduce((acc, curr) => acc + curr, 0);
}

function partOne(): void {
  const initialFish = readInitialFish();
  const finalFishCount = advanceDays(initialFish, 80);
  console.log(finalFishCount);
}

function partTwo(): void {
  const initialFish = readInitialFish();
  const finalFishCount = advanceDays(initialFish, 256);
  console.log(finalFishCount);
}

//partOne();
partTwo();
