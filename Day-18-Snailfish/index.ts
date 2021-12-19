type SnailfishNumber =
  null | number | [SnailfishNumber, SnailfishNumber];
interface SnailfishNumberNode {
  value: SnailfishNumber;
  depth: number;
  parent: [SnailfishNumber, SnailfishNumber];
  parentIndex: number;
}

function parse(snailfishNumberString: string): SnailfishNumber {
  return JSON.parse(snailfishNumberString);
}

const input: SnailfishNumber[] = require('fs')
  .readFileSync(require("path").resolve(__dirname, 'input'), 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map(parse);

function clone(snailfishNumber: SnailfishNumber): SnailfishNumber {
  return JSON.parse(JSON.stringify(snailfishNumber));
}

// add right node to stack before left node in order to traverse in-order
function traverse(
  snailfishNumber: SnailfishNumber,
  callback: (node: SnailfishNumberNode, index: number) => void,
) {
  if (!Array.isArray(snailfishNumber)) return null;
  let [left, right] = snailfishNumber;
  const nodeStack: SnailfishNumberNode[] = [
    { value: right, depth: 1, parent: snailfishNumber, parentIndex: 1 },
    { value: left, depth: 1, parent: snailfishNumber, parentIndex: 1 },
  ];
  let index: number = 0;
  while (nodeStack.length > 0) {
    const node = nodeStack.pop() as SnailfishNumberNode;
    callback(node, index);
    if (Array.isArray(node.value)) {
      const [nodeLeft, nodeRight] = node.value;
      nodeStack.push({ value: nodeRight, depth: node.depth + 1, parent: node.value, parentIndex: 1 });
      nodeStack.push({ value: nodeLeft, depth: node.depth + 1, parent: node.value, parentIndex: 0 });
    } else {
      index += 1;
    }
  }
}

function add(a: SnailfishNumber, b: SnailfishNumber): SnailfishNumber {
  return reduceSnailfishNumber([a, b]);
}

function repeatWhileDifferent(snailfishNumber: SnailfishNumber, getNewSnailfishNumber: (previousSnailfishNumber: SnailfishNumber) => SnailfishNumber): SnailfishNumber {
  let newSnailfishNumber: SnailfishNumber = snailfishNumber;
  let previousSnailfishNumber: SnailfishNumber;
  do {
    previousSnailfishNumber = newSnailfishNumber;
    newSnailfishNumber = getNewSnailfishNumber(previousSnailfishNumber);
  } while (!equals(previousSnailfishNumber, newSnailfishNumber));
  return newSnailfishNumber;
}

function reduceSnailfishNumber(snailfishNumber: SnailfishNumber): SnailfishNumber {
  return repeatWhileDifferent(snailfishNumber, (previousSnailfishNumber) => {
    const afterExplosion = repeatWhileDifferent(previousSnailfishNumber, tryExplode);
    const afterSplit = trySplit(afterExplosion);
    return afterSplit;
  });
}

function tryExplode(snailfishNumber: SnailfishNumber): SnailfishNumber {
  const newSnailfishNumber = clone(snailfishNumber);
  let exploded = false;
  traverse(newSnailfishNumber, (node, index) => {
    if (exploded) return;
    if (Array.isArray(node.value)) {
      if (node.depth >= 4) {
        const [left, right] = node.value;
        if (!Array.isArray(left) && !Array.isArray(right)) {
          addToIndex(newSnailfishNumber, index - 1, left as number);
          addToIndex(newSnailfishNumber, index + 2, right as number);
          node.parent[node.parentIndex] = 0;
          exploded = true;
        }
      }
    }
  });

  return newSnailfishNumber;
}

function trySplit(snailfishNumber: SnailfishNumber): SnailfishNumber {
  const newSnailfishNumber = clone(snailfishNumber);
  let splitted = false;
  traverse(newSnailfishNumber, (node, index) => {
    if (splitted) return;
    if (!Array.isArray(node.value) && (node.value as number) >= 10) {
      const halfValue = (node.value as number) / 2;
      node.parent[node.parentIndex] = [Math.floor(halfValue), Math.ceil(halfValue)];
      splitted = true;
    }
  });

  return newSnailfishNumber;
}

function addToIndex(snailfishNumber: SnailfishNumber, index: number, addBy: number): void {
  traverse(snailfishNumber, (node, currentIndex) => {
    if (!Array.isArray(node.value)) {
      if (currentIndex === index) {
        node.parent[node.parentIndex] = (node.value as number) + addBy;
        return;
      }
    }
  });
}

function magnitude(snailfishNumber: SnailfishNumber): number {
  if (!Array.isArray(snailfishNumber)) {
    return snailfishNumber as number;
  } else {
    const [left, right] = snailfishNumber;
    return 3 * magnitude(left) + 2 * magnitude(right);
  }
}

function equals(a: SnailfishNumber, b: SnailfishNumber): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function assertEquals(a: SnailfishNumber, b: SnailfishNumber, print = false): void {
  if (print) {
    console.log(JSON.stringify(a));
    console.log(JSON.stringify(b));
  }
  console.assert(equals(a, b));
}

function testsPartOne(): void {
  // test explosions
  assertEquals(
    tryExplode(parse('[[[[[9,8],1],2],3],4]')),
    parse('[[[[0,9],2],3],4]'),
  );
  assertEquals(
    tryExplode(parse('[7,[6,[5,[4,[3,2]]]]]')),
    parse('[7,[6,[5,[7,0]]]]'),
  );
  assertEquals(
    tryExplode(parse('[[6,[5,[4,[3,2]]]],1]')),
    parse('[[6,[5,[7,0]]],3]'),
  );
  assertEquals(
    tryExplode(parse('[[3,[2,[1,[7,3]]]],[6,[5,[4,[3,2]]]]]')),
    parse('[[3,[2,[8,0]]],[9,[5,[4,[3,2]]]]]'),
  );
  assertEquals(
    tryExplode(parse('[[3,[2,[8,0]]],[9,[5,[4,[3,2]]]]]')),
    parse('[[3,[2,[8,0]]],[9,[5,[7,0]]]]'),
  );
  assertEquals(
    tryExplode(parse('[[[[0,7],4],[[7,8],[0,[6,7]]]],[1,1]]')),
    parse('[[[[0,7],4],[[7,8],[6,0]]],[8,1]]'),
  );

  // test splits
  assertEquals(
    trySplit(parse('[0, 10]')),
    parse('[0, [5, 5]]'),
  );
  assertEquals(
    trySplit(parse('[0, 11]')),
    parse('[0, [5, 6]]'),
  );
  assertEquals(
    trySplit(parse('[0, 12]')),
    parse('[0, [6, 6]]'),
  );

  // test addition
  assertEquals(
    add(parse('[[[[4,3],4],4],[7,[[8,4],9]]]'), parse('[1,1]')),
    parse('[[[[0,7],4],[[7,8],[6,0]]],[8,1]]'),
  )

  // test magnitude
  console.assert(
    magnitude(parse('[[1,2],[[3,4],5]]')) === 143
  );
  console.assert(
    magnitude(parse('[[[[0,7],4],[[7,8],[6,0]]],[8,1]]')) === 1384
  );
  console.assert(
    magnitude(parse('[[[[1,1],[2,2]],[3,3]],[4,4]]')) === 445
  );
  console.assert(
    magnitude(parse('[[[[3,0],[5,3]],[4,4]],[5,5]]')) === 791
  );
  console.assert(
    magnitude(parse('[[[[5,0],[7,4]],[5,5]],[6,6]]')) === 1137
  );
  console.assert(
    magnitude(parse('[[[[8,7],[7,7]],[[8,6],[7,7]]],[[[0,7],[6,6]],[8,7]]]')) === 3488
  );
}

function partOne(): void {
  const sum = input.reduce((acc, curr) => add(acc, curr));
  const sumMagnitude = magnitude(sum);
  console.log(sumMagnitude);
}

function partTwo(): void {
  let largestMagnitude = -Infinity;
  for (let i = 0; i < input.length; ++i) {
    for (let j = i + 1; j < input.length; ++j) {
      const firstInput = input[i];
      const secondInput = input[j];
      const maxMagnitude = Math.max(
        magnitude(add(firstInput, secondInput)),
        magnitude(add(secondInput, firstInput))
      );
      if (maxMagnitude > largestMagnitude) {
        largestMagnitude = maxMagnitude;
      }
    }
  }
  console.log(largestMagnitude);
}

//testsPartOne();
//partOne();
partTwo();

export {}
