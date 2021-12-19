const fs = require('fs');

const input: number[] = fs.readFileSync('input', 'utf-8')
  .split(/\r?\n/)
  .map((str: string) => parseInt(str));

let previousSlidingWindow: number = input[0] + input[1] + input[2];
let currentSlidingWindow: number = input[1] + input[2] + input[3];
let largerMeasurements: number = currentSlidingWindow > previousSlidingWindow ? 1 : 0;
for (let i = 4; i < input.length; ++i) {
  previousSlidingWindow = currentSlidingWindow;
  currentSlidingWindow -= input[i - 3];
  currentSlidingWindow += input[i];
  if (currentSlidingWindow > previousSlidingWindow)
    largerMeasurements += 1;
}

console.log(largerMeasurements)