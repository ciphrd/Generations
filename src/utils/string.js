import { arr } from "./array"
import { GrowthBytecode } from "../bytecode/growth"
import { ActivationBytecode } from "../bytecode/activation"

export const str = {
  letters: (s) => arr.dedup(s.match(/[a-z]/g)),
  hexbyte: (byte) => byte.toString(16).padStart(2, "0"),
  hexbytes: (bytes) => bytes.map(str.hexbyte),
}

export function dnahex(dna) {
  const growth = GrowthBytecode.parser(dna[0])
  const activations = [ActivationBytecode.parser(dna[1])]

  let s = ""
  for (const u of growth) {
    s += u.toString(16)
  }

  for (const act of activations) {
    s += "\n"
    for (const u of act) {
      s += str.hexbyte(u)
    }
  }

  return s
}

export function strHash(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}
