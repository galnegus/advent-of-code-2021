import Heap from "heap-js";
// imported using require for now because the package is bugged, might need changing to proper ESModule import form if it's updated later
import Long = require("long");

console.time("Execution time");
const input: string[] = require("fs")
  .readFileSync(require("path").resolve(__dirname, "input-part-two"), "utf-8")
  .split(/\r?\n/)
  .filter(Boolean);

interface MapNode {
  x: number;
  y: number;
  posHash: number;
  neighbors: Array<MapNode>;
  neighborDistance: Array<number>;
}

interface Amphipod {
  type: string;
  x: number;
  y: number;
  posHash: number;
}

interface MapState {
  amphipods: Map<number, Amphipod>;
  energy: number;
  steps: number;
  energyToHome?: number;
}

const amphipodTypeColumn: Record<string, number> = {
  A: 3,
  B: 5,
  C: 7,
  D: 9,
};

const columnAmphipodType: Record<number, string> = {
  3: "A",
  5: "B",
  7: "C",
  9: "D",
};

// Fill when parsing initial map stae
const amphipodTypeColumns: Record<string, MapNode[]> = {
  A: [],
  B: [],
  C: [],
  D: [],
};

const homeColumns = new Set<number>([3, 5, 7, 9]);

const amphipodTypeCost: Record<string, number> = {
  A: 1,
  B: 10,
  C: 100,
  D: 1000,
};

const amphipodBitValue: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
};

const hallwayPositions: Array<number> = [1, 2, 4, 6, 8, 10, 11];

const bitMap: Array<Array<number>> = new Array(20)
  .fill(undefined)
  .map(() => new Array(20).fill(null));

function getMapStateHash(mapState: MapState): string {
  let hash = Long.fromInt(0);
  for (const amphipod of mapState.amphipods.values()) {
    const amphipodBits = Long.fromInt(amphipodBitValue[amphipod.type]).shiftLeft(bitMap[amphipod.x][amphipod.y]);
    hash = hash.or(amphipodBits);
  }
  return hash.toString();

  /* let hash = BigInt(0);
  for (const amphipod of mapState.amphipods.values()) {
    const amphipodBits =
      BigInt(amphipodBitValue[amphipod.type]) <<
      BigInt(bitMap[amphipod.x][amphipod.y]);
    hash |= amphipodBits;
  }
  return hash.toString(); */
}

const map: Array<Array<MapNode | null>> = new Array(20)
  .fill(undefined)
  .map(() => new Array(20).fill(null));

function emptyMapNode(
  x: number,
  y: number,
): MapNode {
  return {
    x,
    y,
    posHash: getPosHash(x, y),
    neighbors: [],
    neighborDistance: [],
  };
}

function getPosHash(x: number, y: number): number {
  return x | (y << 4);
}

function parseMap(): void {
  const addNeighbor = (
    stack: Array<MapNode>,
    x: number,
    y: number,
    neighbor: MapNode,
    distance: number
  ): void => {
    if (map[x][y] == null) {
      const newEmptyNode = emptyMapNode(x, y);
      stack.push(newEmptyNode);
      map[x][y] = newEmptyNode;
      if (homeColumns.has(x) && y !== 1) {
        const amphipodType = columnAmphipodType[x];
        amphipodTypeColumns[amphipodType].push(newEmptyNode);
      }
    }
    const newNode = map[x][y] as MapNode;
    neighbor.neighbors.push(newNode);
    neighbor.neighborDistance.push(distance);
    newNode.neighbors.push(neighbor);
    newNode.neighborDistance.push(distance);
  };

  const firstNode = emptyMapNode(1, 1);
  const stack: Array<MapNode> = [firstNode];
  map[1][1] = firstNode;
  let bitMapCounter = 0;
  while (stack.length > 0) {
    const mapNode = stack.pop() as MapNode;
    const { x, y } = mapNode;
    let hasDiagonalNeighbor = false;
    for (const yOffset of [-1, 1]) {
      if (input[y + yOffset][x + 1] !== "#") {
        addNeighbor(stack, x + 1, y + yOffset, mapNode, 2);
        hasDiagonalNeighbor = true;
      }
    }
    // can walk vertically (1 step)
    if (input[y + 1][x] !== "#") {
      addNeighbor(stack, x, y + 1, mapNode, 1);
    }
    // can walk horizontally (1 step)
    if (!hasDiagonalNeighbor && input[y][x + 1] !== "#") {
      addNeighbor(stack, x + 1, y, mapNode, 1);
    }
    // can walk horizontally (2 steps)
    if (hasDiagonalNeighbor && input[y][x + 1] !== "#" && input[y][x + 2] !== "#") {
      addNeighbor(stack, x + 2, y, mapNode, 2);
    }

    // set bitmap, needed for computing mapstate hash later
    bitMap[x][y] = bitMapCounter;
    bitMapCounter += 3; // we need 3 bits, since we have 5 possible values (A, B, C, D, and empty space)
  }
}

function parseInitialMapState(): MapState {
  const mapState: MapState = {
    amphipods: new Map<number, Amphipod>(),
    energy: 0,
    steps: 0,
  };

  for (let x = 0; x < map.length; ++x) {
    for (let y = 0; y < map[0].length; ++y) {
      if (map[x][y] == null) continue;
      const char = input[y][x];
      if (char === ".") continue;
      const posHash = getPosHash(x, y);
      const amphipod: Amphipod = {
        x,
        y,
        posHash,
        type: char,
      };
      mapState.amphipods.set(posHash, amphipod);
    }
  }
  return mapState;
}

function moveAmphipod(
  mapState: MapState,
  amphipod: Amphipod,
  to: [number, number],
  steps: number
): MapState {
  const toHash = getPosHash(to[0], to[1]);
  const movedAmphipod: Amphipod = { ...amphipod };
  const newMapState = {
    amphipods: new Map<number, Amphipod>(mapState.amphipods),
    energy: mapState.energy + amphipodTypeCost[movedAmphipod.type] * steps,
    steps: mapState.steps + steps,
  };
  newMapState.amphipods.delete(amphipod.posHash);
  movedAmphipod.x = to[0];
  movedAmphipod.y = to[1];
  movedAmphipod.posHash = getPosHash(to[0], to[1]);
  newMapState.amphipods.set(toHash, movedAmphipod);
  return newMapState;
}

function homeColumnCanBeVisited(
  mapState: MapState,
  amphipod: Amphipod,
  x: number,
): boolean {
  // if not a column
  if (!homeColumns.has(x)) return true;
  // if you're already in a column, it's fine
  if (amphipod.x === x) return true;
  // if wrong column
  if (amphipodTypeColumn[amphipod.type] !== x) return false;
  return canAmphipodGoHome(mapState, amphipod);
}

function canAmphipodGoHome(mapState: MapState, amphipod: Amphipod): boolean {
    for (const mapNode of amphipodTypeColumns[amphipod.type]) {
      const columnAmphipod = mapState.amphipods.get(mapNode.posHash);
      if (!columnAmphipod) continue;
      if (columnAmphipod.type !== amphipod.type) return false;
    }
    return true;
}

function canAmphipodReachHome(mapState: MapState, amphipod: Amphipod): boolean {
  if (homeColumns.has(amphipod.x)) return true; // skip if in a column already
  const columnPosition = amphipodTypeColumn[amphipod.type];
  for (const hallwayPosition of hallwayPositions) {
    if (
      (hallwayPosition > amphipod.x && hallwayPosition < columnPosition) ||
      (hallwayPosition > columnPosition && hallwayPosition < amphipod.x)
    ) {
      if (mapState.amphipods.has(map[hallwayPosition][1]?.posHash as number)) {
        return false;
      }
    }
  }
  return true;
}

interface TempMove {
  x: number,
  y: number,
  distance: number,
} 
function getAmphipodMoves(mapState: MapState, amphipod: Amphipod): MapState[] {
  // don't move amphipods that are already in position (and there's nothing bad behind it)
  if (amphipod.x === amphipodTypeColumn[amphipod.type] && canAmphipodGoHome(mapState, amphipod))
    return [];

  const moves: TempMove[] = [];
  // second element is distance travelled
  const stack: Array<[MapNode, number]> = [
    [map[amphipod.x][amphipod.y] as MapNode, 0],
  ];
  const visited = new Set<number>([amphipod.posHash]);
  while (stack.length > 0) {
    const [mapNode, distance] = stack.pop() as [MapNode, number];
    for (let index = 0; index < mapNode.neighbors.length; ++index) {
      const neighbor = mapNode.neighbors[index];
      const neighborDistance = mapNode.neighborDistance[index];

      if (
        // Can't be already visited
        visited.has(neighbor.posHash) ||
        // Can't be other amphipods
        mapState.amphipods.has(neighbor.posHash) ||
        // Can't go to wrong column, or correct column occupied by other amphipod types
        !homeColumnCanBeVisited(mapState, amphipod, neighbor.x)
      ) {
        continue;
      }

      // Can't go from hallway to hallway OR stop inside the column (on the way to the hallway)
      if ((amphipod.y !== 1 || neighbor.y !== 1)) {
        moves.push({
          x: neighbor.x,
          y: neighbor.y,
          distance: distance + neighborDistance,
        });
      }

      stack.push([neighbor, distance + neighborDistance]);
      visited.add(neighbor.posHash);
    }
  }
  // if one of the moves is to the home column, only use that move
  if (moves.some((move) => move.x === amphipodTypeColumn[amphipod.type]) && canAmphipodGoHome(mapState, amphipod)) {
    const homeMoves = moves.filter(
      (move) => move.x === amphipodTypeColumn[amphipod.type]
    );
    homeMoves.sort((a, b) => b.y - a.y);
    return [
      moveAmphipod(
        mapState,
        amphipod,
        [homeMoves[0].x, homeMoves[0].y],
        homeMoves[0].distance
      ),
    ];
  }

  const result: MapState[] = [];
  for (const move of moves) {
    if (move.x === amphipod.x) {
      continue;
    }
    result.push(moveAmphipod(
      mapState,
      amphipod,
      [move.x, move.y],
      move.distance
    ));
  }

  return result;
}

function getAllAmphipodMoves(mapState: MapState): MapState[] {
  const moves: MapState[] = [];
  for (const amphipod of mapState.amphipods.values()) {
    // They're in hallway and their home column is not a valid move target
    if (!homeColumns.has(amphipod.x) && !canAmphipodGoHome(mapState, amphipod))
      continue;
    if (!canAmphipodReachHome(mapState, amphipod))
      continue;
    
    moves.push(...getAmphipodMoves(mapState, amphipod));
  }
  return moves;
}

function isOrganized(mapState: MapState): boolean {
  for (const amphipod of mapState.amphipods.values()) {
    if (amphipod.x !== amphipodTypeColumn[amphipod.type]) return false;
  }
  return true;
}

function printState(mapState: MapState): void {
  const { amphipods } = mapState;
  let output = "#############\n#";
  for (let i = 1; i <= 11; ++i) {
    const posHash = getPosHash(i, 1);
    if (amphipods.has(posHash)) {
      output += amphipods.get(posHash)?.type;
    } else {
      output += ".";
    }
  }
  output += "#\n###";
  const rows = amphipods.size / 4;
  for (let row = 0; row < rows; ++row) {
    for (let i = 3; i <= 9; ++i) {
      const posHash = getPosHash(i, row + 2);
      if (i % 2 === 0) {
        output += "#";
      } else if (amphipods.has(posHash)) {
        output += amphipods.get(posHash)?.type;
      } else {
        output += ".";
      }
    }
    if (row === 0) {
      output += "###\n  #"
    } else {
      output += "#\n  #";
    }
  }
  output += "########";
  mutateEnergyToHome(mapState);

  console.log(output);
  console.log("Energy to home:", mapState.energyToHome);
}

/**
 * Mutate mapState object, adding the "energyToHome" prop. Call this with MapState before adding it to heap.
 */
function mutateEnergyToHome(mapState: MapState): void {
  let energyToHome = 0;
  for (const amphipod of mapState.amphipods.values()) {
    const xDistance = Math.abs(amphipod.x - amphipodTypeColumn[amphipod.type]);
    if (xDistance === 0 && canAmphipodGoHome(mapState, amphipod)) {
        continue;
    }
    energyToHome += (xDistance + Math.abs(1 - amphipod.y)) * amphipodTypeCost[amphipod.type];
  }
  mapState.energyToHome = energyToHome;
}

parseMap();
const initialMapState = parseInitialMapState();
mutateEnergyToHome(initialMapState);

//const heap = new Heap<MapState>((a, b) => (a.energy ?? 0) - (b.energy ?? 0));
//const heap = new Heap<MapState>((a, b) => (a.energyToHome ?? 0) - (b.energyToHome ?? 0));
const heap = new Heap<MapState>((a, b) => (a.energy + (a.energyToHome ?? 0)) - (b.energy + (b.energyToHome ?? 0)));
heap.push(initialMapState);
const visited = new Map<string, MapState>([
  [getMapStateHash(initialMapState), initialMapState],
]);

let states = 0;
while (heap.size() > 0) {
  states++;
  const mapState = heap.pop() as MapState;

  // same state might show up multiple times since we add it again if it has lower energy than previously, skip then
  if ((visited.get(getMapStateHash(mapState))?.energy as number) < mapState.energy) {
    continue;
  }

  if (isOrganized(mapState)) {
    console.log('Solution energy:', mapState.energy);
    break;
  }
  const nextMapStates = getAllAmphipodMoves(mapState);
  for (const nextMapState of nextMapStates) {
    const nextMapStateHash = getMapStateHash(nextMapState);
    if (!visited.has(nextMapStateHash)) {
      mutateEnergyToHome(nextMapState);
      visited.set(nextMapStateHash, nextMapState);
      heap.add(nextMapState);
    } else {
      const visitedMapState = visited.get(nextMapStateHash) as MapState;
      if (visitedMapState.energy > nextMapState.energy) {
        mutateEnergyToHome(nextMapState);
        visited.set(nextMapStateHash, nextMapState);
        heap.add(nextMapState);
      }
    }
  }
}

console.log(states);
console.timeEnd("Execution time");
export {};
