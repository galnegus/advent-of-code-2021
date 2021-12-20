console.time("Execution time")
const input: string[] = require('fs')
  .readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

type Padder = '.' | '#';

const imageEnhancementAlgorithm = input[0];
const inputImage = input.slice(1);
const nPads = 2; // should be 2, works with bigger number too, it's just slower

function printImage(image: string[]): void {
  let output = '';
  for (const row of image) {
    output += row + '\n';
  }
  console.log(output);
}

function getEmptyPaddedRow(paddedWidth: number, padder: Padder): string {
  return padder.repeat(paddedWidth);
}

function getNEmptyPaddedRows(n: number, paddedWidth: number, padder: Padder): string[] {
  return (new Array(n)).fill(undefined).map(() => getEmptyPaddedRow(paddedWidth, padder));
}

function getPaddedRow(row: string, leftPadding: number, rightPadding: number, padder: Padder): string {
  return padder.repeat(leftPadding) + row + padder.repeat(rightPadding);
}

function getPaddedImage(image: string[], padder: Padder): string[] {
  const paddedWidth = image[0].length + nPads * 2;
  return [
    ...getNEmptyPaddedRows(nPads, paddedWidth, padder),
    ...image.map((row) => getPaddedRow(row, nPads, nPads, padder)),
    ...getNEmptyPaddedRows(nPads, paddedWidth, padder),
  ];
}

function convolve(paddedImage: string[], x: number, y: number): string {
  const enhancementString =
    paddedImage[y - 1].slice(x - 1, x + 2) +
    paddedImage[y].slice(x - 1, x + 2) +
    paddedImage[y + 1].slice(x - 1, x + 2);
  const enhancementIndexBits = enhancementString.replace(/\./g, '0').replace(/#/g, '1')
  const enhancementIndex = parseInt(enhancementIndexBits, 2);
  return imageEnhancementAlgorithm[enhancementIndex];
}

function iterate(image: string[], padder: Padder = '.'): string[] {
  const paddedImage = getPaddedImage(image, padder);
  let newImage: string[] = [];
  // create new image with size [1, paddedImageSideLength - 2] in either dimension assuming nPads >= 2
  for (let y = 1; y < paddedImage.length - 1; ++y) {
    let row = '';
    for (let x = 1; x < paddedImage[y].length - 1; ++x) {
      row += convolve(paddedImage, x, y);
    }
    newImage.push(row);
  }
  return newImage;
}

function getNextPadder(previousPadder: Padder): Padder {
  if (previousPadder === '#') return imageEnhancementAlgorithm[511] as Padder;
  else return imageEnhancementAlgorithm[0] as Padder;
}

function iterateNTimes(image: string[], n: number): string[] {
  const padderList: Padder[] = (new Array(n - 1)).fill(undefined)
    .reduce<Padder[]>((padders) => [...padders, getNextPadder(padders[padders.length - 1])], ['.']);
  return padderList.reduce((previousImage, padder) => iterate(previousImage, padder), image);
}

function getNumberOfLitPixels(image: string[]): number {
  let numberOfLitPixels = 0;
  for (const row of image) {
    for (const char of row) {
      if (char === '#')
        numberOfLitPixels += 1;
    }
  }
  return numberOfLitPixels;
}

const finalImage = iterateNTimes(inputImage, 50);
console.log(getNumberOfLitPixels(finalImage));

console.timeEnd("Execution time");
