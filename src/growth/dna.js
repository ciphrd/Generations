import { arr, u8arr } from "../utils/array"
import { randomizer, rnd, rnd0 } from "../utils/rnd"

// todo: look more carefully into this file

function generateActivation(seeds, rng) {
  const out = []
  for (let i = 0, n = rng.int(3, 10); i < n; i++) {
    out.push(...rng.el(seeds.activations))
  }

  // todo: improve ofc

  // add at the end
  for (let i = 0, n = rnd0.int(0, 10); i < n; i++) {
    out.push(rnd0.int(0, 32) & 0xff)
  }

  // within
  for (let i = 0, n = rnd0.int(0, 10); i < n; i++) {
    out.splice(rnd0.int(0, out.length - 1), 0, rnd0.int(0, 32) & 0xff)
  }
  return out
}

export function generateDNA(seeds, rng) {
  console.log({ seeds: { ...seeds } })
  const growth = []

  // all dns start with a permutation rule
  growth.push(0x1)
  growth.push(...rng.el(seeds.permutations))
  // marks the end of permutation
  growth.push(128)

  for (let i = 0, m = rng.int(5, 20); i < m; i++) {
    growth.push(rng.int(0, 256) & 0xff)
    // if ($fx.rand() < 0.1) {
    //   growth.push(((0xc << 4) + rng.int(0, 16)) & 0xf)
    // }
  }

  // add random coloration rules
  for (let i = 0, m = rng.int(4, 10); i < m; i++) {
    // 4bits for color sequence code, 4bits for a random letter
    growth.push(0xf0 + (rng.int(0, 16) & 0xf))
    // 8bits for a random rgb332 color
    growth.push(rng.int(0, 256) & 0xff)
  }

  const activation = generateActivation(seeds, rng)

  // improve this mapping for a more robust sol
  return [new Uint8Array(growth), activation]
}

const bitManRng = (rng) => ({
  flipBit: (u8array) => {
    const nbBits = u8array.length * 8
    const flipIdx = rng.int(0, nbBits)
    const byteIdx = floor(flipIdx / 8)
    const inByteIdx = flipIdx % 8
    u8array[byteIdx] ^= 1 << inByteIdx
    return u8array
  },
  addByte: (u8array, byte) => {
    const pos = rng.int(0, u8array.length)
    u8arr.splice(u8array, pos, 0, byte)
    return u8array
  },
  delByte: (u8array) => {
    const pos = rng.int(0, u8array.length - 1)
    u8arr.splice(u8array, pos, 1)
    return u8array
  },
})

function mutatePermutationDNA(dna, rng, strength) {
  // need to keep the first and last bytes
  let mutated = dna.subarray(1, dna.length - 1)
  const bitman = bitManRng(rng)

  for (let i = 0, m = 8; i < m; i++) {
    bitman.flipBit(mutated)
  }

  if (rng.one() < 0.05) {
    mutated = bitman.delByte(mutated)
  }

  if (rng.one() < 0.05) {
    mutated = bitman.addByte(mutated, rng.byte())
  }

  const out = new Uint8Array(mutated.length + 2)
  out[out.length - 1] = dna[dna.length - 1]
  out[0] = dna[0]
  for (let i = 0; i < mutated.length; i++) {
    out[i + 1] = mutated[i]
  }

  return out
}

function mutateActivationDNA(dna, rng, strength) {
  const bitman = bitManRng(rng)

  for (let i = 0, m = 8; i < m; i++) {
    bitman.flipBit(dna)
  }

  if (rng.one() < 0.05) {
    dna = bitman.delByte(dna)
  }

  if (rng.one() < 0.05) {
    dna = bitman.addByte(dna, rng.byte())
  }

  return dna
}

export function mutateDNA(dna, rng, strength) {
  return [
    mutatePermutationDNA(dna[0], rng),
    mutateActivationDNA(dna[1], rng, strength),
  ]
}
