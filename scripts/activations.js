// todo
// - how to handle the growth operations
//   bytecode needed at all ? tbd

function withValues(values, code) {
  return values.map((val) => code(val))
}

/**
 * These small programs are compiled and encoded into the seed.png image which
 * is used to generate functional initial activation sequences. These small
 * sequences are randomly combined to provide diverse yet functionnal
 * behaviours for the first generation.
 */
const seeds = [
  // always fire chemicals
  `
    fire
  `,

  // move forward
  `
    fw
    fire
  `,

  // actuate
  `
    act
    fire
  `,

  // simpler counter
  `
    rot
    push 0.01
    add
    swp
    pop
    swp
    pop
    dup
    rot
    swp
  `,

  // sin waves at various frequencies
  ...withValues(
    [0.01, 0.02, 0.04, 0.08],
    (val) => `
      rot
      push ${val}
      add
      swp
      pop
      swp
      pop
      dup
      cos
      swp
      pop
      swp
      rot
      swp
      fire
    `
  ),

  // sawtooth waves at various frequencies
  ...withValues(
    [0.01, 0.02, 0.04, 0.08],
    (freq) => `
      rot
      push ${freq}
      add
      swp         
      pop
      swp
      pop
      dup
      push 1
      swp
      mod
      swp         
      pop
      swp
      pop
      push 1
      dup
      add
      swp
      pop
      swp
      pop
      mul
      push 1
      swp
      sub
      swp
      pop
      swp
      pop
      swp
      pop
      swp
      pop
      swp
      rot
      fire
    `
  ),

  // signal 1.5x amplifier
  `
    push 1
    push 0.5
    add
    swp
    pop
    swp
    pop
    mul
    swp
    pop
    swp
    pop
    fire
  `,

  // signal inverter
  `
    push 1
    push 0
    sub
    swp
    pop
    swp
    pop
    mul
    swp
    pop
    swp
    pop
    fire
  `,

  // todos
  // - more actions
  // - jumping mecanisms
]

const InstructionSet = [
  "nop_0",
  "nop_1",
  "pop",
  "push",
  "dup",
  "swp",
  "rot",
  "if_less",
  "if_more",
  "jmp",
  "add",
  "sub",
  "mul",
  "mod",
  "fire",
  "fw",
  "bw",
  "act",
  "bnd",
  "grb",
  "eat",
  "sin",
  "cos",
]

const lnreg = /^[a-z_0-4]+|(?:\d(?:\.\d+)?)|\s$/

export function compile(program) {
  console.log("\n")
  console.log("---------------------------------------------------------------")
  console.log(`Compiling...\n${program}`)

  // parse lines, trim & check format
  const parsedLines = []
  const lines = program.split("\n")
  let c = 0
  for (let line of lines) {
    c++
    line = line.trim()
    if (line.length === 0) continue
    if (!lnreg.test(line)) throw Error(`Error at line ${c}: ${line}`)
    parsedLines.push(line)
  }

  // parse intructions into their bit5 representation
  const bit5s = []
  for (const line of parsedLines) {
    const segments = line.split(" ")
    const instruction = segments[0]
    bit5s.push(InstructionSet.indexOf(instruction))

    if (instruction === "push") {
      const nb = Math.max(0, Math.min(1, parseFloat(segments[1])))
      const int = Math.round(nb * 1023)
      const L = (int >> 5) & 0x1f
      const R = int & 0x1f
      bit5s.push(L, R)
    }
  }

  // encode bit5 words into a list of bytes

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
export function encode(compiledSequences) {
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
