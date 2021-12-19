console.time("Execution time")
const input: string[] = require('fs')
  .readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

type Beacon = [number, number, number];
type Scanner = Beacon[];
type RotationAxis = 'x' | '-x' | 'y' | '-y' | 'z' | '-z';
type Rotation = [RotationAxis, RotationAxis, RotationAxis];

// Note: "Computed" manually using right-hand rule :)
// Rotation direction in comments below might be incorrect (ccw instead of cw)
const rotations: Rotation[] = [
  ['x', 'y', 'z'], // facing positive x
  ['x', 'z', '-y'], // rotate 90* around x-axis
  ['x', '-y', '-z'], // rotate 180* around x-axis
  ['x', '-z', 'y'], // rotate 270* around x-axis

  ['-x', 'y', '-z'], // facing negative x
  ['-x', '-z', '-y'], // rotate 90* around x-axis
  ['-x', '-y', 'z'], // rotate 180* around x-axis
  ['-x', 'z', 'y'], // rotate 270* around x-axis

  ['y', '-x', 'z'], // facing positive y
  ['y', 'z', 'x'], // rotate 90* around y-axis
  ['y', 'x', '-z'], // rotate 180* around y-axis
  ['y', '-z', '-x'], // rotate 270* around y-axis

  ['-y', 'x', 'z'], // facing negative y
  ['-y', 'z', '-x'], // rotate 90* around y-axis
  ['-y', '-x', '-z'], // rotate 180* around y-axis
  ['-y', '-z', 'x'], // rotate 270* around y-axis

  ['z', 'y', '-x'], // facing positive z
  ['z', '-x', '-y'], // rotate 90* around z-axis
  ['z', '-y', 'x'], // rotate 180* around z-axis
  ['z', 'x', 'y'], // rotate 270* around z-axis

  ['-z', 'y', 'x'], // facing negative z
  ['-z', 'x', '-y'], // rotate 90* around z-axis
  ['-z', '-y', '-x'], // rotate 180* around z-axis
  ['-z', '-x', 'y'], // rotate 270* around z-axis
]

function getValueOfAxis([x, y, z]: Beacon, rotationAxis: RotationAxis): number {
  switch (rotationAxis) {
    case 'x': return x;
    case '-x': return -x;
    case 'y': return y;
    case '-y': return -y;
    case 'z': return z;
    case '-z': return -z;
  }
  return Infinity;
}

function rotateBeacon(beacon: Beacon, rotation: Rotation): Beacon {
  const newBeacon = rotation.map((rotationAxis) => getValueOfAxis(beacon, rotationAxis)) as Beacon;
  return newBeacon;
}

function rotateScanner(scanner: Scanner, rotation: Rotation): Scanner {
  return scanner.map((beacon) => rotateBeacon(beacon, rotation));
}

function parseScanners(inputStrings: string[]): Scanner[] {
  const scanners: Scanner[] = [];
  let currentScanner: Scanner = [];
  for (const line of inputStrings) {
    if (line.startsWith('--- scanner')) {
      currentScanner = [];
      scanners.push(currentScanner);
    } else {
      currentScanner.push(line.split(',').map(Number) as Beacon);
    }
  }
  return scanners;
}

function getBeaconString([x, y, z]: Beacon): string {
  return `${x},${y},${z}`;
}

/**
 * a - b
 */
function subtract([x0, y0, z0]: Beacon, [x1, y1, z1]: Beacon): Beacon {
  return [x0 - x1, y0 - y1, z0 - z1];
}

/**
 * a + b
 */
function add([x0, y0, z0]: Beacon, [x1, y1, z1]: Beacon): Beacon {
  return [x0 + x1, y0 + y1, z0 + z1];
}


function manhattanDistance([x0, y0, z0]: Beacon, [x1, y1, z1]: Beacon): number {
  return Math.abs(x0 - x1) + Math.abs(y0 - y1) + Math.abs(z0 - z1);
}

const scanners = parseScanners(input);

/**
 * Origo of "absolute coordinate system" is set to scanner[0]
 */
const absoluteScanners: Scanner[] = [scanners[0]];
const absoluteBeaconStrings = new Set<string>(scanners[0].map(getBeaconString));
/**
 * Ignore scanners with these indices while searching for new pairings
 */
const absoluteScannerIndices = new Set<number>([0]);

function findOverlap(
  absoluteScanner: Scanner,
  absoluteScannerStringSet: Set<string>,
  otherScanner: Scanner,
): {
  scanner: Scanner,
  scannerPosition: Beacon,
} | null {
  for (const absoluteBeacon of absoluteScanner) {
    for (const otherBeacon of otherScanner) {
      const diff = subtract(absoluteBeacon, otherBeacon);
      const movedScannerStrings = otherScanner.map((beacon) => getBeaconString(add(beacon, diff)));

      let numberOfOverlaps = 0;
      for (let i = 0; i < movedScannerStrings.length; ++i) {
        const movedScannerString = movedScannerStrings[i];
        // early exit when finding 12 overlaps is impossible
        if (movedScannerStrings.length - i + numberOfOverlaps < 12) break;
        if (absoluteScannerStringSet.has(movedScannerString))
          numberOfOverlaps += 1;
      }

      if (numberOfOverlaps >= 12) {
        return {
          scanner: otherScanner.map((beacon) => add(beacon, diff)),
          scannerPosition: diff,
        };
      }
    }
  }
  return null;
}

function getScannerSignature(scanner: Scanner): Set<number> {
  const signature = new Set<number>();
  for (let i = 0; i < scanner.length; ++i) {
    for (let j = i; j < scanner.length; ++j) {
      signature.add(manhattanDistance(scanner[i], scanner[j]));
    }
  }
  return signature;
}

function signatureSimilarities(signatureA: Set<number>, signatureB: Set<number>): number {
  let similarities = 0;
  for (const num of signatureA) {
    if (signatureB.has(num)) similarities += 1;
  }
  return similarities;
}

/**
 * Array of rotated scanners, so we don't need to recompute this all the time
 */
const rotatedScanners: Map<Rotation, Scanner>[] = scanners
  .map((scanner) =>
    new Map<Rotation, Scanner>(
      rotations.map((rotation) => [rotation, rotateScanner(scanner, rotation)]
    )
  )
);

const scannerPositions: Beacon[] = [[0, 0, 0]]; // [0, 0, 0] is the position of scanners[0]

/**
 * This is here for optimization, adding this it went from taking ~9 minutes to taking 10 seconds (on repl.it)
 */
const scannerSignatures = scanners.map(getScannerSignature);

while (absoluteScanners.length > 0) {
  const absoluteScanner = absoluteScanners.pop() as Scanner;
  const absoluteScannerStringSet = new Set<string>(absoluteScanner.map(getBeaconString));
  const absoluteScannerSignature = getScannerSignature(absoluteScanner);
  for (let i = 0; i < scanners.length; ++i) {
    if (absoluteScannerIndices.has(i)) continue;
    // (12 * 12 / 2) since that's how many similarities there will be (at least) for 12 common beacons
    if (signatureSimilarities(absoluteScannerSignature, scannerSignatures[i]) < (12 * 12 / 2)) continue;
    const scannerCandidate = scanners[i];
    for (const rotation of rotations) {
      const rotatedCandidate = rotatedScanners[i].get(rotation) as Scanner;
      const overlapData = findOverlap(absoluteScanner, absoluteScannerStringSet, rotatedCandidate);
      if (overlapData !== null) {
        const { scanner: overlappingCandidate, scannerPosition } = overlapData;
        scannerPositions.push(scannerPosition);
        absoluteScanners.push(overlappingCandidate);
        absoluteScannerIndices.add(i);
        overlappingCandidate.map(getBeaconString)
          .forEach(absoluteBeaconStrings.add, absoluteBeaconStrings);
        break;
      }
    }
  }
}

let maxManhattanDistance = -Infinity;
for (const a of scannerPositions) {
  for (const b of scannerPositions) {
    //const manhattanDistance = Math.abs(x0 - x1) + Math.abs(y0 - y1) + Math.abs(z0 - z1);
    const distance = manhattanDistance(a, b);
    if (distance > maxManhattanDistance)
      maxManhattanDistance = distance;
  }
}

console.log('beacons:', absoluteBeaconStrings.size);
console.log('max manhattan distance:', maxManhattanDistance);
console.timeEnd("Execution time");

export {}
