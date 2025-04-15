import { rnd } from "../utils/rnd"

function generateActivation(seeds) {
  const out = []
  for (let i = 0, n = rnd.int(2, 6); i < n; i++) {
    out.push(...rnd.el(seeds.activations))
  }

  // todo: improve ofc
  for (let i = 0, n = rnd.int(5, 20); i < n; i++) {
    out.splice(rnd.int(0, out.length - 1), 0, rnd.int(0, 32) & 0xff)
  }
  return out
}

function generateDNA(seeds) {
  console.log({ seeds })
  const growth = []

  // all dns start with a permutation rule
  growth.push(0x1)
  growth.push(...rnd.el(seeds.permutations))
  // marks the end of permutation
  growth.push(128)

  for (let i = 0, m = rnd.int(5, 20); i < m; i++) {
    growth.push(rnd.int(0, 256) & 0xff)
    // if ($fx.rand() < 0.1) {
    //   growth.push(((0xc << 4) + rnd.int(0, 16)) & 0xf)
    // }
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
