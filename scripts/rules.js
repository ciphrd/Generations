import sharp from "sharp"
import path from "path"

const ROOT = path.join(import.meta.dirname, "..")
const OUTPUT_PATH = path.join(ROOT, "src", "permutations.png")

/**
 * To optimize storage, rules are stored in their bytecode representation.
 * Rules are written in human language here, and a script is used to compile
 * them into their bytecode.
 *
 * The permutation bytecode is represented as following:
 *
 * A series of bytes, where each byte has the same structure:
 * +--+---+---+
 * |ID|Lt1|Lt2|
 * +--+---+---+
 *
 * - ID: 2 bits sequence identifier
 *   - 0b00: new rule segment
 *   - 0b01: new edge
 * - Lt1/Lt2: 2x3bits to encode 2 letters
 *
 * Every odd new rule segment encodes the beginning of the right part of the
 * permutation, every even encodes the beginning of a new permutation rule.
 *
 * Each letter is encoded over 3 bits, counting from 0 to 7 over xyzwstuv where
 * x is 0 and v is 7.
 */

const permutations = [
  // small triangles, many loops
  "{{{x,y},{x,z},{x,w}}->{{v,u},{u,v},{v,t},{u,t},{t,v},{t,u},{v,y},{u,z},{t,w}}}",
  // fractal division into many extremieties, multiple extremieties per node
  "{{{x,y},{y,z}}->{{w,x},{x,w},{w,z},{x,v},{y,z}}}",
  // robust triangulated strings, algae
  "{{{x,y},{y,z},{z,w},{w,x}}->{{x,y},{z,w},{w,x},{y,v},{v,u},{u,z},{z,y},{y,u}}}",
  // robust triangluated bodies & strings
  "{{{x,y},{y,z},{z,w},{w,x}}->{{x,y},{y,x},{z,w},{w,z},{w,x},{x,w},{y,v},{v,y},{v,u},{u,v},{u,z},{z,u},{z,y},{y,z},{y,u},{u,y}}}",
  // fractal division into many extremities
  "{{{x,y}}->{{x,z},{z,w},{y,z}}}",
  // strings of hexagons
  "{{{x,y},{y,z},{z,w},{w,v},{v,x}}->{{x,y},{y,z},{z,w},{w,v},{v,x},{y,x},{u,y},{t,u},{s,t},{x,s}}}",
  // few loops, lots of string freedom
  "{{{x,y},{x,z}}->{{w,x},{w,x},{w,y},{v,x},{z,v}}}",
  // few big chunky dots, many interconnections
  "{{{x,y},{x,y}}->{{z,y},{z,y},{y,x},{x,z}}}",
  // few loops, mainly long strings
  "{{{x,y},{x,z},{x,w}}->{{v,u},{u,v},{v,y},{v,t},{y,t},{u,z},{w,v}}}",
  // big loops with smaller loops inside, quite cellular-like
  "{{{x,y},{x,z}}->{{y,y},{y,w},{x,w},{z,w}}}",
  // many small loops, triangular extremities
  "{{{x,y},{x,z}}->{{w,y},{w,v},{y,v},{v,z}}}",
  // many small loops
  "{{{x,y},{y,z}}->{{w,y},{y,w},{w,z},{x,w}}}",
  // ""
  "{{{x,y},{y,z}}->{{w,y},{y,w},{w,v},{w,x},{z,v}}}",
  // tighly connected leaves ?
  "{{{x,y},{y,z}}->{{x,y},{y,z},{z,w},{w,v},{v,x}}}",
  // hexagons with 2 sides connected
  "{{{x,y}}->{{x,y},{y,z},{z,w},{w,v},{v,x}}}",
  // strong triangular strands, not exclusively though
  "{{{x,y},{y,z},{z,w},{w,x}}->{{x,y},{y,z},{z,w},{w,x},{y,v},{v,u},{u,z},{z,y},{y,u}}}",
  // tighly connected clusters, with medium-sized strands
  "{{{x,y},{x,z},{x,w}}->{{v,y},{y,v},{v,z},{z,w},{w,y}}}",
  // triangular, dispersed clusters
  "{{{x,y}}->{{x,z},{x,z},{y,z},{y,z}}}",
  // long simple string
  "{{{x,y}}->{{x,z},{z,y}}}",
  // simple long string, growing * 2
  "{{{x,y}}->{{x,w},{w,v},{v,y}}}",
  // triangles/squares connected together
  "{{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{v,z},{w,v},{u,x},{u,w}}}",
  // squares connected together
  "{{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{v,z},{w,v}}}",
  // tightly-packed
  "{{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{w,y}}}",
  // clusters, but with small-to-long strands
  "{{{x,y},{y,z}}->{{x,y},{y,w},{w,y},{z,x}}}",
  // long strands, very few branches
  "{{{x,y},{x,z}}->{{x,y},{y,z},{z,w}}}",
  // few loops with very long strands (cool)
  "{{{x,y},{x,z}}->{{x,w},{y,w},{z,w}}}",
  // tighyl packed but preserves big nested structure
  "{{{x,y},{x,z}}->{{x,y},{x,w},{y,w},{z,w}}}",
]

const regpart = /^{(.*)}$/
const regparts = /({[^{}]*})/g
const sortedLetters = "xyzwstuv"

function encodeSegment(type, letters) {
  let byte = 0x00
  if (type === "edge") {
    byte |= 0b1
  }
  for (let i = 0; i < 2; i++) {
    byte = (byte << 3) | sortedLetters.indexOf(letters[i])
  }
  return byte
}

function encode(rule) {
  const [input, output] = rule
    .split("->")
    .map((a) =>
      [...regpart.exec(a)[1].matchAll(regparts)].map((a) =>
        regpart.exec(a[1])[1].split(",")
      )
    )
  const bytes = []
  for (let i = 0; i < input.length; i++) {
    bytes.push(encodeSegment(i === 0 ? "rule" : "edge", input[i]))
  }
  for (let i = 0; i < output.length; i++) {
    bytes.push(encodeSegment(i === 0 ? "rule" : "edge", output[i]))
  }
  return bytes
}

function decodeByte(byte) {
  const letters = []
  for (let i = 0; i < 2; i++) {
    letters.unshift(sortedLetters[byte & 0x7])
    byte >>= 3
  }
  byte &= 0x1
  return {
    type: byte ? "edge" : "rule",
    letters,
  }
}

function decode(bytecode) {
  const rules = []

  let c = -1
  for (const byte of bytecode) {
    const { type, letters } = decodeByte(byte)

    if (type === "rule") {
      c++
      if (c % 2 === 0) {
        rules.push([[], []])
      }
    }

    const rule = rules.at(-1)

    rule[c % 2].push(letters)
  }

  return rules
}

// const encoded = permutations.map((perm) => encode(perm)).flat()
// const decoded = decode(encoded)

async function main() {
  const encoded = permutations.map((perm) => encode(perm)).flat()
  console.log(encoded)
  await sharp(new Uint8Array(encoded), {
    raw: { width: encoded.length, height: 1, channels: 1 },
  })
    .png()
    .toFile(OUTPUT_PATH)
}
main()
