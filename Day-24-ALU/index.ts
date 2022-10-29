import Long = require("long");

console.time("Execution time");
const input: string[] = require("fs")
  .readFileSync(require("path").resolve(__dirname, "input"), "utf-8")
  .split(/\r?\n/)
  .filter(Boolean);

type Variables = [w: number, x: number, y: number, z: number];
type VariableIndex = Record<'w' | 'x' | 'y' | 'z', number>;
type Variable = keyof VariableIndex;
const variableIndexes: VariableIndex = {
  w: 0,
  x: 1,
  y: 2,
  z: 3,
}

type InputCallback = (variables: Variables, input: number) => void;
type StandardCallback = (variables: Variables) => void;
type InputFunction = (a: Variable) => InputCallback;
type StandardFunction = (a: Variable, b: Variable | number) => StandardCallback;
interface Functions {
  inp: InputFunction;
  add: StandardFunction;
  mul: StandardFunction;
  div: StandardFunction;
  mod: StandardFunction;
  eql: StandardFunction;
}
type ProgramSection = Array<InputCallback | StandardCallback>;
type Program = Array<ProgramSection>;

// Helpers
function bValue(variables: Variables, b: Variable | number): number {
  if (typeof b === "number") return b;
  else return variables[variableIndexes[b]];
}
// https://stackoverflow.com/a/175787
function isNumeric(str: string): boolean {
  if (typeof str !== "string") return false; // we only process strings!
  return (
    !isNaN(str as unknown as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}
const validFunctionKeys = new Set<string>([
  "inp",
  "add",
  "mul",
  "div",
  "mod",
  "eql",
]);
function isInputFunctionKey(func: string): func is "inp" {
  return func === "inp";
}
function isInputFunctionArgs(
  func: string,
  args: (string | number)[]
): args is Parameters<InputFunction> {
  return func === "inp" && args.length === 1 && typeof args[0] === "string";
}
function isStandardFunctionKey(
  func: string
): func is keyof Omit<Functions, "inp"> {
  return validFunctionKeys.has(func);
}
function isStandardFunctionArgs(
  func: string,
  args: (string | number)[]
): args is Parameters<StandardFunction> {
  return (
    validFunctionKeys.has(func) &&
    func !== "inp" &&
    args.length === 2 &&
    typeof args[0] === "string" &&
    (typeof args[1] === "string" || typeof args[1] === "number")
  );
}

// ALU functions
const functions: Functions = {
  inp(a: Variable) {
    return (variables, input) => (variables[variableIndexes[a]] = input ?? Number.NEGATIVE_INFINITY);
  },
  add(a: Variable, b: Variable | number) {
    return (variables) =>
      (variables[variableIndexes[a]] =
        variables[variableIndexes[a]] + bValue(variables, b));
  },
  mul(a: Variable, b: Variable | number) {
    return (variables) =>
      (variables[variableIndexes[a]] =
        variables[variableIndexes[a]] * bValue(variables, b));
  },
  div(a: Variable, b: Variable | number) {
    return (variables) =>
      (variables[variableIndexes[a]] = Math.floor(
        variables[variableIndexes[a]] / bValue(variables, b)
      ));
  },
  mod(a: Variable, b: Variable | number) {
    return (variables) =>
      (variables[variableIndexes[a]] =
        variables[variableIndexes[a]] % bValue(variables, b));
  },
  eql(a: Variable, b: Variable | number) {
    return (variables) =>
      (variables[variableIndexes[a]] =
        variables[variableIndexes[a]] === bValue(variables, b) ? 1 : 0);
  },
};

function parseProgram(): Program {
  const program: Program = [[]];
  let programSection = program[0];
  for (const line of input) {
    const [func, ...args] = line.split(" ");
    let typedArgs = args.map((arg) =>
      isNumeric(arg) ? parseInt(arg, 10) : arg
    );
    if (isInputFunctionKey(func) && isInputFunctionArgs(func, typedArgs)) {
      if (programSection.length > 0) {
        programSection = [];
        program.push(programSection);
      }
      programSection.push(functions.inp(...typedArgs));
    } else if (isStandardFunctionKey(func) && isStandardFunctionArgs(func, typedArgs)) {
      programSection.push(functions[func](...typedArgs));
    }
  }
  return program;
}

/**
 * ASSUMPTION: Each program section starts with an input command (and contains no other input commands), that's why we only have 1 number as input
 * NOTE: variables will be mutated, clone before calling if you want to keep your old variables.
 */
function runProgramSection(programSection: ProgramSection, variables: Variables, inputDigit: number): void {
  for (const functionCallback of programSection) {
    functionCallback(variables, inputDigit);
  }
}

function emptyVariables(): Variables {
  return [0, 0, 0, 0];
}

// Looking at the code, the output for each section only depends on the value of z and the input, since x and y are always multiplied by zero in each section anyway
function variablesInputHash(variables: Variables, inputDigit: number): number {
  // only need to shift 4 bits, since inputDigit is just a digit with 9 possible values
  //return Long.fromInt(variables[variableIndexes.z]).shiftLeft(4).or(inputDigit - 1).toNumber();

  // Not 100% sure if it's safe to assume z only uses 28 bits, but seems to work and slight performance improvement over using the long package so why not 😁
  return (variables[variableIndexes.z] << 4) | (inputDigit - 1);
}

function findZero(digits: Array<number>): string {
  const program = parseProgram();
  const sectionFails: Array<Set<number>> = [];
  for (let i = 0; i < 14; ++i) {
    sectionFails.push(new Set());
  }
  return findZeroHelper(program, digits, 0, emptyVariables(), sectionFails) ?? 'fail';
}

// After part one, I found that the value of z between sections is either (z * 26 <= zPrev <= z * 27) or (z / 27 <= zPrev <= z / 26)
// and for the final section to produce z = 0, the value z in the previous section must be no greater than 19.
const zUpperBoundary = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  19 * 27 ** 6,
  19 * 27 ** 5,
  19 * 27 ** 4,
  19 * 27 ** 3,
  19 * 27 ** 2,
  19 * 27,
  19,
];

function findZeroHelper(
  program: Program,
  digits: Array<number>,
  depth: number,
  variables: Variables,
  sectionFails: Array<Set<number>>
): string | null {
  const upperBoundary = zUpperBoundary[depth];
  if (upperBoundary !== null && variables[variableIndexes.z] > upperBoundary) {
    return null;
  }

  // Running the program section will mutate the variables, store the original ones so we can restore them after (if needed)
  const originalVariables: Variables = [...variables];
  for (const inputDigit of digits) {
    const hash = variablesInputHash(originalVariables, inputDigit);
    if (sectionFails[depth].has(hash)) {
      continue;
    }

    runProgramSection(program[depth], variables, inputDigit);

    if (depth === 13) {
      if (variables[variableIndexes.z] === 0) {
        return `${inputDigit}`;
      }
    } else {
      const result = findZeroHelper(
        program,
        digits,
        depth + 1,
        variables,
        sectionFails
      );
      if (result !== null) {
        return `${inputDigit}${result}`;
      } else {
        sectionFails[depth].add(hash);
      }
    }

    for (let i = 0; i < 4; ++i) {
      variables[i] = originalVariables[i];
    }
  }

  return null;
}

// find largest
console.log('Largest:', findZero([9, 8, 7, 6, 5, 4, 3, 2, 1]));

// find smallest
console.log('Smallest:', findZero([1, 2, 3, 4, 5, 6, 7, 8, 9]));

console.timeEnd("Execution time");
export {};
