const fs = require('fs');

const input: string[] = fs.readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

type HeightMap = number[][];
type Position = [number, number];

function parseHeightMap(): HeightMap {
  return input.map((line) => line.split('').map((char) => parseInt(char, 10)));
}

function findLowPoints(heightMap: HeightMap): Position[] {
  const lowPoints: Position[] = [];
  for (let i = 0; i < heightMap.length; ++i) {
    const row = heightMap[i];
    for (let j = 0; j < row.length; ++j) {
      const currentPosition = heightMap[i][j];
      if (i > 0 && heightMap[i - 1][j] <= currentPosition) continue;
      if (j > 0 && heightMap[i][j - 1] <= currentPosition) continue;
      if (i < heightMap.length - 1 && heightMap[i + 1][j] <= currentPosition) continue;
      if (j < row.length - 1 && heightMap[i][j + 1] <= currentPosition) continue;
      lowPoints.push([i, j]);
    }
  }
  return lowPoints;
}

function riskSum(heightMap: HeightMap, lowPoints: Position[]): number {
  return lowPoints.reduce((acc, [i, j]) => acc + heightMap[i][j] + 1, 0);
}

function posStr([i, j]: Position): string {
  return `${i},${j}`;
}

function findBasins(heightMap: HeightMap): number[] {
  const searchedPositions = new Set<string>();
  const foundBasinSizes: number[] = [];
  const lowPoints = findLowPoints(heightMap);
  for (const lowPoint of lowPoints) {
    const searchStack: Position[] = [lowPoint];
    searchedPositions.add(posStr(lowPoint));
    let basinSize = 0;
    while (searchStack.length > 0) {
      const [i, j] = searchStack.pop() as Position;
      if (i > 0 && heightMap[i - 1][j] < 9 && !searchedPositions.has(posStr([i - 1, j]))) {
        searchedPositions.add(posStr([i - 1, j]));
        searchStack.push([i - 1, j])
      };
      if (j > 0 && heightMap[i][j - 1] < 9 && !searchedPositions.has(posStr([i, j - 1]))) {
        searchedPositions.add(posStr([i, j - 1]));
        searchStack.push([i, j - 1])
      } ;
      if (i < heightMap.length - 1 && heightMap[i + 1][j] < 9 && !searchedPositions.has(posStr([i + 1, j]))) {
        searchedPositions.add(posStr([i + 1, j]));
        searchStack.push([i + 1, j]);
      }
      if (j < heightMap[i].length - 1 && heightMap[i][j + 1] < 9 && !searchedPositions.has(posStr([i, j + 1]))) {
        searchedPositions.add(posStr([i, j + 1]));
        searchStack.push([i, j + 1]);
      }
      basinSize += 1;
    }
    foundBasinSizes.push(basinSize);
  }
  foundBasinSizes.sort((a, b) => b - a);
  return foundBasinSizes.slice(0, 3);
}

function partOne() {
  const heightMap = parseHeightMap();
  const lowPoints = findLowPoints(heightMap);
  console.log(riskSum(heightMap, lowPoints));
}

function partTwo() {
  const heightMap = parseHeightMap();
  const basins = findBasins(heightMap);
  console.log(basins.reduce((acc, curr) => acc * curr));
}

//partOne();
partTwo();

export {}
