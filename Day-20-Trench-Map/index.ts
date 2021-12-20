console.time("Execution time")
const input: string[] = require('fs')
  .readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

const imageEnhancementAlgorithm = input[0];
const inputImage = input.slice(1);
const padBy = 2;

function printImage(image: string[]): void {
  let output = '';
  for (const row of image) {
    output += row + '\n';
  }
  console.log(output);
}

function getEmptyPaddedRow(paddedWidth: number, padWith: string): string {
  return padWith.repeat(paddedWidth);
}

function getNEmptyPaddedRows(n: number, paddedWidth: number, padWith: string): string[] {
  return (new Array(n)).fill(undefined).map(() => getEmptyPaddedRow(paddedWidth, padWith));
}

function getPaddedRow(row: string, leftPadding: number, rightPadding: number, padWith: string): string {
  return padWith.repeat(leftPadding) + row + padWith.repeat(rightPadding);
}

function getPaddedImage(image: string[], padWith: string): string[] {
  const paddedWidth = image[0].length + padBy * 2;
  return [
    ...getNEmptyPaddedRows(padBy, paddedWidth, padWith),
    ...image.map((row) => getPaddedRow(row, padBy, padBy, padWith)),
    ...getNEmptyPaddedRows(padBy, paddedWidth, padWith),
  ];
}

function convolve(paddedImage: string[], x: number, y: number): string {
  const enchancementString =
    paddedImage[y - 1].slice(x - 1, x + 2) +
    paddedImage[y].slice(x - 1, x + 2) +
    paddedImage[y + 1].slice(x - 1, x + 2);
  const enchancementIndexBits = enchancementString.replace(/\./g, '0').replace(/#/g, '1')
  const enchancementIndex = parseInt(enchancementIndexBits, 2);
  return imageEnhancementAlgorithm[enchancementIndex];
}

function iterate(image: string[], padWith = '.'): string[] {
  const paddedImage = getPaddedImage(image, padWith);
  let newImage: string[] = [];
  // create new image with dimension [1, paddedImageSideLength - 1) in either dimension assuming padBy >= 2
  for (let y = 1; y < paddedImage.length - 1; ++y) {
    let row = '';
    for (let x = 1; x < paddedImage[y].length - 1; ++x) {
      row += convolve(paddedImage, x, y);
    }
    newImage.push(row);
  }
  return newImage;
}

function iterateNTimes(image: string[], n: number): string[] {
  const alternateInfinity = imageEnhancementAlgorithm[0] === '#';
  const padWithList = (new Array(n))
    .fill(undefined)
    .map((_, i) => (i % 2 === 1) && alternateInfinity ? '#' : '.');
  return padWithList.reduce((previousImage, padWith) => iterate(previousImage, padWith), image);
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
