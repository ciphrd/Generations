// todo
// - how to handle the growth operations
//   bytecode needed at all ? tbd

/**
 * These small programs are compiled and encoded into the seed.png image which
 * is used to generate functional initial activation sequences. These small
 * sequences are randomly combined to provide diverse yet functionnal
 * behaviours for the first generation.
 */
const seeds = [
  // always fire chemical 1
  `
fire_1
`,

  // move forward if chemical 0 signal is received
  `
zero
chem_0
if_more
fw
`,

  // add all the chemicals in stack position 0
  `
chem_0
chem_1
add
swp
pop
chem_2
add
swp
pop
chem_3
add
swp
pop
`,

  // trigger eat if the value in the stack is greater than zero
  `
zero
if_less
eat
pop
`,

  // move forward
  `
fw
`,

  // actuate
  `
act
`,

  // fire other chemicals when chemical received
  `
zero
chem_0
if_more
fire_1
`,
  `
zero
chem_1
if_more
fire_2
`,
  `
zero
chem_2
if_more
fire_3
`,
  `
zero
chem_3
if_more
fire_0
`,

  // push sin(time) to the stack
  `
time
sin
`,

  // todos
  // - more actions
  // - jumping mecanisms
]

const InstructionSet = [
  "nop_0",
  "nop_1",
  "pop",
  "swp",
  "rot",
  "zero",
  "if_less",
  "if_more",
  "jmp",
  "add",
  "sub",
  "chem_0",
  "chem_1",
  "chem_2",
  "chem_3",
  "fire_0",
  "fire_1",
  "fire_2",
  "fire_3",
  "reng",
  "fw",
  "bw",
  "act",
  "bnd",
  "grb",
  "eat",
  "sin",
  "cos",
  "time",
]

function compile(program) {
  console.log("\n")
  console.log("---------------------------------------------------------------")
  console.log(`Compiling...\n${program}`)

  const lines = program.split("\n").filter((l) => l.length > 0)
  const words = lines.map((ln) => ln.split(" ").at(0))
  const bit5s = words.map((word) => InstructionSet.indexOf(word))

  const bytes = []
  let bitIndex = 0
  let byte = 0x00

  for (const bit5 of bit5s) {
    for (let i = 0; i < 5; i++) {
      byte |= (bit5 >> (4 - i)) & 0b1
      bitIndex++
      if (bitIndex === 8) {
        bitIndex = 0
        bytes.push(byte)
        byte = 0x00
      } else {
        byte <<= 1
      }
    }
  }
  if (bitIndex !== 0) {
    bytes.push(byte << (8 - bitIndex - 1))
  }

  console.log("Compiled bytecode:")
  console.log(bytes.map((byte) => byte.toString(16).padStart(2, "0")).join(""))

  return bytes
}

function compilePrograms(programs) {
  const compiled = []
  for (const program of programs) {
    compiled.push(compile(program))
  }
  return compiled
}

/**
 * Encodes the byte sequences into bytes, so that it can be written on the seed
 * image.
 *
 * Layout of a single sequence:
 *
 * +---+=================+
 * |SZE|BYTECODE SEQUENCE|
 * +---+=================+
 *
 * The sequences are repeated until all of the sequences are encoded, upon which
 * a byte 0 is added to mark the end.
 *
 * +---+========+---+========+ - - - +---+========+---+
 * |SZE|BYTECODE|SZE|BYTECODE| ..... |SZE|BYTECODE| 0 |
 * +---+========+---+========+ - - - +---+========+---+
 */
function encode(compiledSequences) {
  const bytes = []
  for (const sequence of compiledSequences) {
    bytes.push(sequence.length)
    bytes.push(...sequence)
  }
  bytes.push(0)
  return new Uint8Array(bytes)
}

export function encodedActivations() {
  return encode(compilePrograms(seeds))
}
