import { rnd, rnd0 } from "../utils/rnd"

function generateActivation(seeds) {
  const out = []
  for (let i = 0, n = rnd0.int(1, 4); i < n; i++) {
    out.push(...rnd0.el(seeds.activations))
  }

  // todo: improve ofc

  // add at the end
  // for (let i = 0, n = rnd0.int(0, 10); i < n; i++) {
  //   out.push(rnd0.int(0, 32) & 0xff)
  // }

  // within
  // for (let i = 0, n = rnd0.int(0, 10); i < n; i++) {
  //   out.splice(rnd0.int(0, out.length - 1), 0, rnd0.int(0, 32) & 0xff)
  // }
  return out
}

function generateDNA(seeds) {
  console.log({ seeds })
  const growth = []

  // all dns start with a permutation rule
  growth.push(0x1)
  growth.push(...rnd0.el(seeds.permutations))
  // marks the end of permutation
  growth.push(128)

  for (let i = 0, m = rnd0.int(5, 20); i < m; i++) {
    growth.push(rnd0.int(0, 256) & 0xff)
    // if ($fx.rand() < 0.1) {
    //   growth.push(((0xc << 4) + rnd0.int(0, 16)) & 0xf)
    // }
  }

  // add random coloration rules
  for (let i = 0, m = rnd0.int(4, 10); i < m; i++) {
    // 4bits for color sequence code, 4bites for a random letter
    growth.push(0xf0 + (rnd0.int(0, 16) & 0xf))
    // 8bits for a random rgb332 color
    growth.push(rnd0.int(0, 256) & 0xff)
  }

  const activations = Array(4)
    .fill(0)
    .map(() => generateActivation(seeds))

  // improve this mapping for a more robust sol
  return [
    new Uint8Array(growth),
    ...activations.map((act) => new Uint8Array(act)),
  ]
}

export function generateDNAs(seeds) {
  return [...Array(16)].map(() => generateDNA(seeds))
}
