/**
 *
 */

import { clamp, fract } from "../utils/math"
import { Operation } from "./cpu"

/**
 * ; 00    ; nop_0    ;
 * ; 01    ; nop_1    ;
 * ; 02    ; pop      ; remove st0
 * ; 03    ; swp      ; swap st0 and st1
 * ; 04    ; rot      ; swap first and last stack values
 * ; 05    ; push     ; push next 5 bits to stack (normalized)
 * ; 06    ; if_less  ; if st0 < st1, execute next instruction
 * ; 07    ; if_more  ; if st0 > st1, execute next instruction
 * ; 08    ; jmp      ; jump to closest matching complementary template
 * ; 09    ; add      ; st0 + st1, put in st0
 * ; 0a    ; sub      ; st0 - st1, put in st0
 * ; 0b-0e ; chem_0-3 ; push body chemical value to stack
 * ; 0f-12 ; fire_0-3 ; fire chemical as signal
 * ; 13    ; reng     ; push body energy level
 * ; 14    ; fw       ; generate force in forwards direction
 * ; 15    ; bw       ; generate force in backwards direction
 * ; 16    ; act      ; actuate spring forces
 * ; 17    ; bnd      ; bind with closest foreign body
 * ; 18    ; grb      ; increase friction
 * ; 19    ; eat      ; eat food source if in range
 * ; 1a    ; sin      ; put sin(st0) in st0
 * ; 1b    ; cos      ; put cos(st0) in st0
 * ; 1c    : time     ; push sim time
 * ; 1d-1f ; /        ; yet unallocated plage
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
    const instruction = instructions[pointer]
    // console.log(`Executing instruction: ${set[instruction]}`)

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
        pointer++
        stack.push(instructions[pointer] / 31)
        break
      }
      // swp
      case 0x04: {
        stack.swap()
        break
      }
      // rot
      case 0x05: {
        stack.rot()
        break
      }
      // if_less
      case 0x06: {
        if (stack.get(0) >= stack.get(1)) pointer++
        break
      }
      // if_more
      case 0x07: {
        if (stack.get(0) <= stack.get(1)) pointer++
        break
      }
      // jmp
      case 0x08: {
        // todo
        break
      }
      // add
      case 0x09: {
        stack.push(stack.get(0) + stack.get(1))
        break
      }
      // sub
      case 0x0a: {
        stack.push(stack.get(0) - stack.get(1))
        break
      }
      // chem0-chem3
      case 0x0b:
      case 0x0c:
      case 0x0d:
      case 0x0e: {
        stack.push(context.body.signals[instruction - 0x0b] & 0xf)
        break
      }
      // fire0
      case 0x0f:
      case 0x10:
      case 0x11:
      case 0x12: {
        // todo how do we handle these ? since we want to potentially
        // merge all the fired of a same chemical as a single Token
        // also to avoid exponential growth there should only be 1 Token
        // emission / tick
        // todo maybe one token can hold multiple chemicals ? that seems
        // elegant ?
        operations.push(
          new Operation("fire", [instruction - 0x0f, stack.get(0)])
        )
        break
      }
      // reng
      case 0x13: {
        stack.push(context.body.energy)
        break
      }
      // fw
      case 0x14: {
        operations.push(new Operation("forward", [stack.get(0)]))
        break
      }
      // bw
      case 0x15: {
        operations.push(new Operation("backward", [stack.get(0)]))
        break
      }
      // act
      case 0x16: {
        operations.push(new Operation("actuate", [stack.get(0)]))
        break
      }
      // bnd
      case 0x17: {
        operations.push(new Operation("bind", [stack.get(0)]))
        break
      }
      // grb
      case 0x18: {
        operations.push(new Operation("grab", [stack.get(0)]))
        break
      }
      // eat
      case 0x19: {
        operations.push(new Operation("eat", [stack.get(0)]))
        break
      }
      // sin
      case 0x1a: {
        stack.push(sin(stack.get(0)) * 0.5 + 0.5)
        break
      }
      // cos
      case 0x1b: {
        stack.push(cos(stack.get(0)) * 0.5 + 0.5)
        break
      }

      // undefined yet
      case 0x1c:
      case 0x1d:
      case 0x1e:
      case 0x1f:
        break
      default:
        throw "fatal"
    }

    return { pointer, stack, operations }
  },
}
