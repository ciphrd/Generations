import { arr } from "./array"
import { GrowthBytecode } from "../bytecode/growth"
import { ActivationBytecode } from "../bytecode/activation"

export const str = {
  letters: (s) => arr.dedup(s.match(/[a-z]/g)),
}

export function dnahex(dna) {
  const growth = GrowthBytecode.parser(dna[0])
  const activations = [ActivationBytecode.parser(dna[1])]

  let str = ""
  for (const u of growth) {
    str += u.toString(16)
  }

  for (const act of activations) {
    str += "\n"
    for (const u of act) {
      str += u.toString(16).padStart(2, "0")
    }
  }

  return str
}

export function strHash(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}
