const fs = require('fs');

const input: string[] = fs.readFileSync('input', 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

function buildCaveMap(): Map<string, string[]> {
  const caveMap = new Map<string, string[]>();
  for (const line of input) {
    const [a, b] = line.split('-');
    const aLinks = caveMap.get(a) ?? [];
    const bLinks = caveMap.get(b) ?? [];
    if (b !== 'start' && a !== 'end')
      caveMap.set(a, [...aLinks, b]);
    if (a !== 'start' && b !== 'end')
      caveMap.set(b, [...bLinks, a]);
  }
  return caveMap;
}

function isSmallCave(cave: string): boolean {
  return cave !== 'start' && cave !== 'end' && cave === cave.toLowerCase();
}

function paths(
  caveMap: Map<string, string[]>, 
  path: string,
): number {
  const splitPath = path.split(',');
  const currentCave = splitPath[splitPath.length - 1];
  if (currentCave === 'end') return 1;
  const smallCavesInPath = splitPath.filter(isSmallCave);
  const visitedSmallCaves = new Set();
  let anySmallCaveVisitedTwice = false;
  for (const cave of smallCavesInPath) {
    if (visitedSmallCaves.has(cave)) anySmallCaveVisitedTwice = true;
    visitedSmallCaves.add(cave);
  }

  const partOneFilter = (cave: string) =>
    !visitedSmallCaves.has(cave);
  const partTwoFilter = (cave: string) =>
    !visitedSmallCaves.has(cave) || !anySmallCaveVisitedTwice;

  const nextCaves = (caveMap.get(currentCave) as string[]).filter(partTwoFilter);

  return nextCaves.reduce(
    (sum, nextCave) => sum + paths(caveMap, `${path},${nextCave}`),
  0);
}

function answer(): void {
  const caveMap = buildCaveMap();
  const numberOfPaths = paths(caveMap, 'start');
  console.log(numberOfPaths);
}

answer();
