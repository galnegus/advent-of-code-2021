const input: string[] = require('fs').readFileSync('input', 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

function hex2binary(hex: string) {
  return hex.split('')
    .map((char) => (parseInt(char, 16).toString(2))
      .padStart(4, '0'))
    .join('');
}

// global state because why not? less code this way :)
let bits: string;
let bitPointer: number = 0;
let versionNumberSum = 0;

function parse(str: string): number {
  bits = hex2binary(str);
  bitPointer = 0;
  versionNumberSum = 0;
  return packet();
}

function consumeStr(numberOfBits: number): string {
  const consumedBits = bits.slice(bitPointer, bitPointer + numberOfBits);
  bitPointer += numberOfBits;
  return consumedBits;
}
function consume(numberOfBits: number): number {
  return parseInt(consumeStr(numberOfBits), 2);
}

function packet(): number {
  const versionNumber = consume(3);
  versionNumberSum += versionNumber;
  const typeId = consume(3);
  if (typeId === 4) {
    return literalValue();
  } else {
    const lengthTypeId = consume(1);
    const subpackets: number[] = [];
    if (lengthTypeId === 0) {
      const subpacketsLength = consume(15);
      const stopAt = bitPointer + subpacketsLength;
      do {
        subpackets.push(packet());
      } while (bitPointer < stopAt);
    } else {
      const numberOfSubpackets = consume(11);
      for (let i = 0; i < numberOfSubpackets; ++i) {
        subpackets.push(packet());
      }
    }
    switch (typeId) {
      case 0:
        return subpackets.reduce((sum, subpacket) => sum + subpacket);
      case 1:
        return subpackets.reduce((product, subpacket) => product * subpacket);
      case 2:
        return Math.min(...subpackets);
      case 3:
        return Math.max(...subpackets);
      case 5:
        return subpackets[0] > subpackets[1] ? 1 : 0;
      case 6:
        return subpackets[0] < subpackets[1] ? 1 : 0;
      case 7:
        return subpackets[0] === subpackets[1] ? 1 : 0;
    }
  }

  return -1;
}

function literalValue(): number {
  let startsWith: number;
  let valueBuilder: string = '';
  do {
    startsWith = consume(1);
    valueBuilder += consumeStr(4);
  } while (startsWith === 1);
  return parseInt(valueBuilder, 2);
}

function partOneTests(): void {
  // Test packet literal value
  console.assert(parse('D2FE28') === 2021);

  // Test version sums
  parse('38006F45291200');
  console.assert(versionNumberSum === 1 + 6 + 2);
  parse('EE00D40C823060');
  console.assert(versionNumberSum === 7 + 2 + 4 + 1);
  parse('8A004A801A8002F478');
  console.assert(versionNumberSum === 16);
  parse('620080001611562C8802118E34')
  console.assert(versionNumberSum === 12);
  parse('C0015000016115A2E0802F182340')
  console.assert(versionNumberSum === 23);
  parse('A0016C880162017C3686B18A3D4780')
  console.assert(versionNumberSum === 31);
}

function partOne(): void {
  parse(input[0]);
  console.log(versionNumberSum);
}

function partTwoTests(): void {
  console.assert(parse('C200B40A82') === 1 + 2);
  console.assert(parse('04005AC33890') === 6 * 9);
  console.assert(parse('880086C3E88112') === Math.min(7, 8, 9));
  console.assert(parse('CE00C43D881120') === Math.max(7, 8, 9));
  console.assert(parse('D8005AC2A8F0') === 1); // 5 < 15
  console.assert(parse('F600BC2D8F') === 0); // 5 > 15
  console.assert(parse('9C005AC2F8F0') === 0); // 5 === 15
  console.assert(parse('9C0141080250320F1802104A08') === 1); // 1 + 3 === 2 * 2
}

function partTwo(): void {
  console.log(parse(input[0]));
}

//partOneTests();
//partOne();
//partTwoTests();
partTwo();
