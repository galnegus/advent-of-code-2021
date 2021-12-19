const fs = require('fs');

const input: string[] = fs.readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .map((str: string) => parseInt(str));

let largerMeasurements = 0;
for (let i = 1; i < input.length; ++i) {
  if (input[i] > input[i - 1])
    largerMeasurements += 1;
}

console.log(largerMeasurements);

export {}
