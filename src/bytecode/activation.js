/**
 *
 */

import { clamp, fract, mod } from "../utils/math"
import { Operation } from "./cpu"

/**
 * ; 00    ; nop_0    ;
 * ; 01    ; nop_1    ;
 * ; 02    ; pop      ; remove st0
 * ; 03    ; push     ; push next 10 bits to stack (normalized)
 * ; 04    ; dup      ; push st0 to stack (duplicate st0)
 * ; 05    ; swp      ; swap st0 and st1
 * ; 06    ; rot      ; swap first and last stack values
 * ; 07    ; if_less  ; if st0 < st1, execute next instruction
 * ; 08    ; if_more  ; if st0 > st1, execute next instruction
 * ; 09    ; jmp      ; jump to closest matching complementary template
 * ; 0a    ; add      ; st0 + st1, put in st0
 * ; 0b    ; sub      ; st0 - st1, put in st0
 * ; 0c    ; mul      ; st0 - st1, put in st0
 * ; 0d    ; mod      ; st0 - st1, put in st0
 * ; 0e-11 ; fire_0-3 ; fire chemical as signal
 * ; 12    ; reng     ; push body energy level
 * ; 13    ; fw       ; generate force in forwards direction
 * ; 14    ; bw       ; generate force in backwards direction
 * ; 15    ; act      ; actuate spring forces
 * ; 16    ; bnd      ; bind with closest foreign body
 * ; 17    ; grb      ; increase friction
 * ; 18    ; eat      ; eat food source if in range
 * ; 19    ; sin      ; put sin(st0) in st0
 * ; 1a    ; cos      ; put cos(st0) in st0
 * ; 1b-1f ; /        ; yet unallocated plage
 *
 * Potential additions:
 *
 * dup: duplicate st0
 */

/**
 * Potential new instructions:
 * ===========================
 * - ALL (apply the next operation on the whole stack, moving the pointer on
 *   each element)
 * - shift (shift + PI/2) using   cos(acos(x)+PI/2)
 * -
 */

const set = [
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

export const ActivationBytecode = {
  mnemonics: set,
  parser: (bytecode) => {
    const instructions = []
    let bitIndex = 0
    let bit5 = 0b0
    for (const byte of bytecode) {
      for (let i = 0; i < 8; i++) {
        bit5 |= (byte >> (7 - i)) & 0b1
        bitIndex++
        if (bitIndex === 5) {
          bitIndex = 0
          instructions.push(bit5)
          bit5 = 0b0
        } else {
          bit5 <<= 1
        }
      }
    }
    return instructions
  },
  exec: (instructions, pointer, stack, context) => {
    const operations = []
    const instruction = getInstructionAt(instructions, pointer)
    // console.log(`Executing instruction: ${set[instruction]}`)

    if (isNaN(context.chemicalStrength)) throw null

    const op = (type, energy = stack.get(0)) => new Operation(type, energy)

    try {
      switch (instruction) {
        // nop_0
        case 0x00:
          break
        // nop_1
        case 0x01:
          break
        // pop
        case 0x02: {
          stack.pop()
          break
        }
        // push
        case 0x03: {
          const L = getInstructionAt(instructions, ++pointer)
          const R = getInstructionAt(instructions, ++pointer)
          stack.push(((L << 5) | R) / 1023)
          break
        }
        // dup
        case 0x04: {
          stack.push(stack.get(0))
          break
        }
        // swp
        case 0x05: {
          stack.swap()
          break
        }
        // rot
        case 0x06: {
          stack.rot()
          break
        }
        // if_less
        case 0x07: {
          if (stack.get(0) >= stack.get(1)) pointer++
          break
        }
        // if_more
        case 0x08: {
          if (stack.get(0) <= stack.get(1)) pointer++
          break
        }
        // jmp
        case 0x09: {
          // todo
          break
        }
        // add
        case 0x0a: {
          stack.push(stack.get(0) + stack.get(1))
          break
        }
        // sub
        case 0x0b: {
          stack.push(stack.get(0) - stack.get(1))
          break
        }
        // mul
        case 0x0c: {
          stack.push(stack.get(0) * stack.get(1))
          break
        }
        // mod
        case 0x0d: {
          stack.push(mod(stack.get(0), stack.get(1)))
          break
        }
        // fire
        case 0x0e: {
          operations.push(op("fire", clamp(stack.get(0), -1, 1)))
          break
        }
        // fw
        case 0x0f: {
          operations.push(op("forward"))
          break
        }
        // bw
        case 0x10: {
          operations.push(op("backward"))
          break
        }
        // act
        case 0x11: {
          operations.push(op("actuate"))
          break
        }
        // bnd
        case 0x12: {
          operations.push(op("bind"))
          break
        }
        // grb
        case 0x13: {
          operations.push(op("grab"))
          break
        }
        // eat
        case 0x14: {
          operations.push(op("eat"))
          break
        }
        // sin
        case 0x15: {
          stack.push(sin(stack.get(0)))
          break
        }
        // cos
        case 0x16: {
          stack.push(cos(stack.get(0)))
          break
        }

        // undefined yet
        case 0x17:
        case 0x18:
        case 0x19:
        case 0x1a:
        case 0x1b:
        case 0x1c:
        case 0x1d:
        case 0x1e:
        case 0x1f:
          break
        default:
          throw "fatal"
      }
    } catch (err) {
      console.log([...stack.values])
      console.log(instruction)
      throw err
    }

    return { pointer, stack, operations }
  },
}

function getInstructionAt(instructions, pointer) {
  if (pointer < instructions.length) return instructions[pointer]
  else return 0x00
}
