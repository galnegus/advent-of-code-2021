import Heap from "heap-js";
// imported using require for now because the package is bugged, might need changing to proper ESModule import form if it's updated later
import Long = require("long");

console.time("Execution time");
const input: string[] = require("fs")
  .readFileSync(require("path").resolve(__dirname, "input"), "utf-8")
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
  isInGoal: boolean;
}

interface MapState {
  amphipods: Map<number, Amphipod>;
  energy: number;
  steps: number;
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

  for (const [type, column] of Object.entries(amphipodTypeColumn)) {
    let isInGoal = true;
    for (let row = input.length - 2; row > 1; --row) {
      const char = input[row][column];
      if (char !== type) isInGoal = false;
      const posHash = getPosHash(column, row);
      const amphipod: Amphipod = {
        x: column,
        y: row,
        posHash,
        type: char,
        isInGoal,
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
  newMapState.amphipods.delete(getPosHash(amphipod.x, amphipod.y));
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
  return amphipodTypeColumns[amphipod.type]
    .map((mapNode) => mapState.amphipods.get(mapNode.posHash))
    .filter(Boolean)
    .every((columnAmphipod) => columnAmphipod?.type === amphipod.type);
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
  /* const visited: Array<Array<boolean>> = new Array(20)
    .fill(undefined)
    .map(() => new Array(20).fill(false));
  visited[amphipod.x][amphipod.y] = true; */
  const visited = new Set<number>([amphipod.posHash]);
  while (stack.length > 0) {
    const [mapNode, distance] = stack.pop() as [MapNode, number];
    mapNode.neighbors
      .map<[MapNode, number]>((neighbor, index) => [
        neighbor,
        mapNode.neighborDistance[index],
      ])
      .filter(
        ([neighbor]) =>
          // Can't be already visited
          //!visited[neighbor.x][neighbor.y] &&
          !visited.has(neighbor.posHash) &&
          // Can't be other amphipods
          !mapState.amphipods.has(neighbor.posHash) &&
          // Can't go to wrong column, or correct column occupied by other amphipod types
          homeColumnCanBeVisited(mapState, amphipod, neighbor.x)
      )
      .forEach(([neighbor, neighborDistance]) => {
        // Can't go from hallway to hallway
        if (amphipod.y !== 1 || neighbor.y !== 1) {
          moves.push({
            x: neighbor.x,
            y: neighbor.y,
            distance: distance + neighborDistance,
          });
        }
        stack.push([neighbor, distance + neighborDistance]);
        visited.add(neighbor.posHash);
        //visited[neighbor.x][neighbor.y] = true;
      });
  }
  // if one of the moves is to the home column, only use that move
  if (moves.some((move) => move.x === amphipodTypeColumn[amphipod.type])) {
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

  return moves.map((move) =>
    moveAmphipod(
      mapState,
      amphipod,
      [move.x, move.y],
      move.distance
    )
  );
}

function getAllAmphipodMoves(mapState: MapState): MapState[] {
  const moves: MapState[] = [];
  for (const amphipod of mapState.amphipods.values()) {
    // They're in hallway and their home column is not a valid move target
    if (!homeColumns.has(amphipod.x) && !canAmphipodGoHome(mapState, amphipod))
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

parseMap();
const initialMapState = parseInitialMapState();
const heap = new Heap<MapState>((a, b) => a.energy - b.energy);
heap.push(initialMapState);
const visited = new Map<string, number>([[getMapStateHash(initialMapState), initialMapState.energy]]);

while (heap.size() > 0) {
  const mapState = heap.pop() as MapState;
  //console.log(getMapStateHash(mapState));
  if (isOrganized(mapState)) {
    console.log('Solution energy:', mapState.energy);
    break;
  }
  const nextMapStates = getAllAmphipodMoves(mapState);
  for (const nextMapState of nextMapStates) {
    const nextMapStateHash = getMapStateHash(nextMapState);
    if (!visited.has(nextMapStateHash)) {
      visited.set(nextMapStateHash, nextMapState.energy);
      heap.add(nextMapState);
    } else {
      const visitedMapStateEnergy = visited.get(nextMapStateHash) as number;
      if (visitedMapStateEnergy > nextMapState.energy) {
        visited.set(nextMapStateHash, nextMapState.energy);
        heap.add(nextMapState);
      }
    }
  }
}

console.timeEnd("Execution time");
export {};
