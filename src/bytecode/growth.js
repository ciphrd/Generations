/**
 * Growth Bytecode spec.
 *
 * The interpreter operates on a 4 bit Stack. Each instruction is stored on
 * 4 bits (16 instructions total). There's 4 different types supported:
 * - u4
 * - bool
 * - dna
 * - letter
 * Each type is encoded on 4 bits and supports the full range of values
 * represented by these bits. As such, autocast between types is natively
 * supported, ensuring that no mutation can effectively break the growth
 * bytecode sequence interpretation.
 *
 *  0  ; nop  ;
 *  1  ; pmut ; permutation, reads the follow-up sequence as permutation
 *  2  ; asg  ; letter, dna ; assign a dna to a letter. if the letter isn't
 *            ; available with permut rules, picks the closest one
 *  3  ; rnd  ; push a random integer to stack
 *  4  ; pop  ; pop value from the stack
 *  5  ; swp  ; swap st0 and st1 from stack
 *  6  ; rot  ; swap st0 and st9
 *  7  ; dup  ; push st0
 *  8  ; eith ; push either st0 if st2 true, or st1
 *  9  ; gt   ; push true/false, result of st0 > st1
 *  A  ; if   ; execute next instruction if st0 is true
 *  B  ; nedg ; letter ; push number of edges of node associated with letter
 *  C  ; push ; any ; push value to stack (literals)
 *  D  ; dnal ; letter ; push current dna of letter
 *  E  ; sens ; u8, letter, u16 ; add a sensor to node; sensor is picked using
 *            ; u8 % sensors.length
 *  F  ; /   ; yet unallocated
 */

import { Node } from "../graph/node"
import { Params } from "../parametric-space"
import { SensorKeys } from "../sensors"
import { Color } from "../utils/color"
import { clamp01, mod } from "../utils/math"

const set = [
  "nop",
  "pmut",
  "asg",
  "rnd",
  "pop",
  "swp",
  "rot",
  "dup",
  "eith",
  "gt",
  "if",
  "nedg",
  "push",
  "dnal",
  "sens",
  "color",
]

const sortedLetters = "xyzwstuv"

// todo: used elsewhere ? single declaration
const letters = "xyzwstuv".split("")

export const GrowthBytecode = {
  mnemonics: set,
  parser: (bytecode) => {
    const instructions = []
    for (const byte of bytecode) {
      instructions.push((byte >> 4) & 0xf)
      instructions.push(byte & 0xf)
    }
    return instructions
  },
  exec: (instructions, pointer, stack, context) => {
    const rng = Params.growthRngSequence
    const { nodes, node, nodemap, dnas } = context
    const operations = []
    const instruction = instructions[pointer]

    // todo remove
    console.log({ instructions, pointer, instruction })
    console.log(`Executing instruction: ${set[instruction]}`)
    console.log({ stack: [...stack.values] })

    switch (instruction) {
      // nop
      case 0x0:
        break
      // pmut
      case 0x1: {
        // only 1 permutation rule per run ?
        if (context.nodemap) break

        // todo implement with more resilience

        const rule = [[], []]
        let c = -1
        pointer++
        while (pointer < instructions.length) {
          if (instructions[pointer] & 8) c++
          // todo: check if this instruction is correct based on the design
          //       this is a quick hack to get mutations working
          if (c < 0) break
          if (c >= 2) break
          rule[c].push([
            sortedLetters[instructions[pointer++] & 7],
            sortedLetters[instructions[pointer++] & 7],
          ])
        }

        const [input, output] = rule
        const nodemap = {
          x: node,
        }
        const edges = {}

        // returns the index of an edge A->B, if it exists and is
        // still available (once edge used by the input it cannot be used again)
        // if b is undefined, returns the first available edge of node A
        function matchEdge(a, b) {
          let match = null
          if (!edges[a.id]) edges[a.id] = []
          const bias = rng.int(0, a.edges.length)
          for (let i = 0; i < a.edges.length; i++) {
            const di = (i + bias) % a.edges.length
            if (edges[a.id].includes(di)) continue
            if (!b || a.edges[di] === b) {
              match = { i: di, node: a.edges[di] }
              break
            }
          }
          if (match) edges[a.id].push(match.i)
          return match?.node || null
        }

        // parse the input to associate letters with nodes
        for (const [a, b] of input) {
          if (!nodemap[a]) break
          if (nodemap[a].edges.length === 0) break
          const match = matchEdge(nodemap[a], nodemap[b])
          if (!match) break
          if (!nodemap[b]) nodemap[b] = match
        }

        // remove all used edges
        for (const id in edges) {
          const node = nodes.find((n) => n.id === id)
          const sortedEdges = edges[id].sort((a, b) => b - a)
          for (const idx of sortedEdges) {
            node.edges.splice(idx, 1)
          }
        }

        const inputLetters = input.reduce((a, b) => b.concat(a), [])
        function spawnNode() {
          const out = new Node(
            node.pos
              .clone()
              .add(
                rng.range(0.0005, 0.05) * rng.sign(),
                rng.range(0.0005, 0.05) * rng.sign()
              )
              .apply(clamp01),
            node.dna
          )
          out.data = { ...node.data }
          return out
        }

        for (const [a, b] of output) {
          if (!nodemap[a]) nodemap[a] = spawnNode()
          if (!nodemap[b]) nodemap[b] = spawnNode()
          nodemap[a].edges.push(nodemap[b])
        }
        for (const n of Object.values(nodemap)) {
          if (!nodes.includes(n)) nodes.push(n)
        }
        context.nodemap = nodemap
        break
      }
      // asg
      case 0x2: {
        const letter = GrowthBytecode.decode(stack.get(0), "letter", context)
        nodemap[letter].setDNA(
          GrowthBytecode.decode(stack.get(1), "dna", context)
        )
        break
      }
      // rnd
      case 0x3:
        stack.push(rng.int(0, 16) & 0xf)
        break
      // pop
      case 0x4:
        stack.pop()
        break
      // swp
      case 0x5:
        stack.swap()
        break
      // rot
      case 0x6:
        stack.rot()
        break
      // dup
      case 0x7:
        stack.dup()
        break
      // eith
      case 0x8: {
        const s0 = stack.pop()
        const s1 = stack.get(0)
        stack.push(GrowthBytecode.decode(stack.get(1), "bool") ? s0 : s1)
        break
      }
      // gt
      case 0x9:
        if (stack.get(0) <= stack.get(1)) pointer++
        break
      // if
      case 0xa:
        if (!GrowthBytecode.decode(stack.get(0), "bool")) pointer++
        break
      // nedg
      case 0xb: {
        const letter = GrowthBytecode.decode(stack.get(0), "letter", context)
        stack.push(nodemap[letter].edges.length & 0xf)
        break
      }
      // push
      case 0xc:
        stack.push(instructions[++pointer])
        break
      // dnal
      case 0xd: {
        // todo: check if works
        const letter = GrowthBytecode.decode(stack.get(0), "letter", context)
        stack.push(dnas.indexOf(nodemap[letter].dna) & 0xf)
        break
      }
      // sens
      case 0xe: {
        const letter = GrowthBytecode.decode(stack.get(0), "letter", context)
        const s1 = stack.get(1)
        const sensor = SensorKeys[s1 & 3]
        const add = !!(((s1 >> 2) & 1) ^ ((s1 >> 3) & 1))
        if (!add) {
          delete nodemap[letter].sensors[sensor]
          break
        }
        let u16 = 0
        for (let i = 0; i < 4; i++) {
          u16 <<= 4
          u16 |= stack.get(2 + i)
        }
        nodemap[letter].sensors[sensor] = u16
        break
      }

      // coloring
      case 0xf: {
        const letter = GrowthBytecode.decode(
          instructions[min(pointer + 1, instructions.length - 1)],
          "letter",
          context
        )
        const s1 = instructions[min(pointer + 2, instructions.length - 1)]
        const s2 = instructions[min(pointer + 3, instructions.length - 1)]
        const byte = (s1 << 4) + s2
        const color = Color.fromByteRgb332(byte)

        // half of the time, colors edges, otherwise colors the node
        if (stack.get(0) >> 3) {
          nodemap[letter].edgeColors = color
        } else {
          nodemap[letter].color = color
        }

        pointer += 3
        break
      }

      default:
        throw "fatal"
    }

    return { pointer, stack, operations }
  },

  decode: (byte, type, context) => {
    switch (type) {
      case "u4": {
        let u4 = 0
        for (let i = 0; i < 4; i++) {
          u4 += ((byte >> i) & 1) * pow(2, i)
        }
        return u4
      }
      case "bool": {
        let b = 0
        for (let i = 0; i < 4; i++) {
          b ^= (byte >> i) & 1
        }
        return !!b
      }
      case "dna": {
        return context.dnas[GrowthBytecode.decode(byte, "u4", context)]
      }
      case "letter": {
        let u3 = 0
        for (let i = 0; i < 3; i++) {
          u3 += ((byte >> i) & 1) * pow(2, i)
        }
        let letter = letters[u3]
        if (context.nodemap) {
          let i = 1,
            idx
          while (!context.nodemap[letter] && i <= 7) {
            idx = mod(u3 + ceil(i / 2) * (i % 2 ? 1 : -1), 8)
            i++
            letter = letters[idx]
          }
        }
        return letter
      }

      default:
        throw "fatal"
    }
  },
}
