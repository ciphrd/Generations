/**
 * To optimize storage, rules are stored in their bytecode representation.
 * Rules are written in human language here, and a script is used to compile
 * them into their bytecode.
 *
 * The permutation bytecode is represented as following:
 *
 * A letter is encoded using an identifying bit, and 3 bits to encode the letter
 * index in the following list: xyzwstuv
 * +---+---+---+---+
 * |ID1|  letter   |
 * +---+---+---+---+
 *
 * Since edges require have 2 nodes, an edge is represented with 2 segments:
 * +---+---+---+---+---+---+---+---+
 * |ID1|  letter1  |ID2|  letter2  |
 * +---+---+---+---+---+---+---+---+
 *
 * Permutation rules are 2 series of edges, each edge being at least 2 letters.
 * To encode this representation, and allow series of permutations to be encoded
 * next to each other, we use the first bit of the first letter to encode the
 * category of the following edge:
 * - 0x0: new edge
 * - 0x1: new rule
 *
 * New rule alternates between defining the right part of the permutation, and
 * defining a new rule altogether. A rule always start with 0x1, indicating a
 * new rule.
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
  if (type === "rule") {
    byte |= 0x1
  }
  byte = (byte << 3) | sortedLetters.indexOf(letters[0])
  byte = (byte << 4) | sortedLetters.indexOf(letters[1])
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
    byte >>= 4 - i
  }
  byte &= 0x1
  return {
    type: byte ? "rule" : "edge",
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

export function encodedPermutations() {
  return permutations.map((perm) => encode(perm)).flat()
}
