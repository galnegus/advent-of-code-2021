const fs = require('fs');

const input: string[] = fs.readFileSync('input', 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

interface BitMetadata {
  mostCommonBits: number[],
  leastCommonBits: number[],
  equalAmountBits: number[],
}

function getBitMetadata(input: string[]): BitMetadata {
  const noBits: number = input[0].length;
  const mostCommonBits: number[] = [];
  const equalAmountBits: number[] = new Array(noBits).fill(0);
  const oneBitSums: number[] = new Array(noBits).fill(0);
  const zeroBitSums: number[] = new Array(noBits).fill(0);
  for (const line of input) {
    for (let i = 0; i < noBits; ++i) {
      switch (line.charAt(i)) {
        case '0':
          zeroBitSums[i] += 1;
          break;
        case '1':
          oneBitSums[i] += 1;
          break;
      }
    }
  }
  for (let i = 0; i < noBits; ++i) {
    const greatest = oneBitSums[i] > zeroBitSums[i] ? 1 : 0;
    mostCommonBits.push(greatest);
    if (oneBitSums[i] === zeroBitSums[i]) equalAmountBits[i] = 1;
  }
  const leastCommonBits = mostCommonBits.map((mostCommonBit) => (mostCommonBit + 1) % 2);
  return {
    mostCommonBits,
    leastCommonBits,
    equalAmountBits,
  };
}

function partOne(): void {
  const { mostCommonBits, leastCommonBits } = getBitMetadata(input);
  const gammaRate = parseInt(mostCommonBits.join(''), 2);
  const epsilonRate = parseInt(leastCommonBits.join(''), 2);
  console.log(gammaRate * epsilonRate);
}

function computeRating(bitSelector: (bitMetadata: BitMetadata, index: number) => number): number {
  const noBits: number = input[0].length;
  let inputKept = input;
  for (let i = 0; i < noBits; ++i) {
    const bitMetadata = getBitMetadata(inputKept);
    const bitToKeep = bitSelector(bitMetadata, i);
    const lastInput = inputKept[inputKept.length - 1];
    inputKept = inputKept.filter((bits) => +bits.charAt(i) === bitToKeep)
    if (inputKept.length === 1) return parseInt(inputKept[0], 2);
    if (inputKept.length === 0) return parseInt(lastInput, 2);
  }
  return -1;
}

function partTwo(): void {
  const oxygenGeneratorRating = computeRating(
    ({ mostCommonBits, equalAmountBits }: BitMetadata, index: number) =>
      equalAmountBits[index] === 1 ? 1 : mostCommonBits[index]
  );
  const co2ScrubberRating = computeRating(
    ({ leastCommonBits, equalAmountBits }: BitMetadata, index: number) =>
      equalAmountBits[index] === 1 ? 0 : leastCommonBits[index]
  );
  console.log(oxygenGeneratorRating * co2ScrubberRating);
}

//partOne();
partTwo();
