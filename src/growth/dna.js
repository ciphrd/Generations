import { rnd } from "../utils/rnd"

function generateDNA(seeds) {
  console.log({ seeds })
  const growth = []

  // all dns start with a permutation rule
  growth.push(0x1)
  growth.push(...rnd.el(seeds.permutations))
  // marks the end of permutation
  growth.push(128)

  for (let i = 0, m = rnd.int(10, 30); i < m; i++) {
    growth.push(rnd.int(0, 256) & 0xff)
    // if ($fx.rand() < 0.1) {
    //   growth.push(((0xc << 4) + rnd.int(0, 16)) & 0xf)
    // }
  }

  const activation = []
  for (let i = 0, n = rnd.int(3, 10); i < n; i++) {
    activation.push(...rnd.el(seeds.activations))
  }
  // todo: improve ofc
  for (let i = 0, n = rnd.int(10, 20); i < n; i++) {
    activation.splice(
      rnd.int(0, activation.length - 1),
      0,
      rnd.int(0, 32) & 0xff
    )
  }

  return [new Uint8Array(growth), new Uint8Array(activation)]
}

export function generateDNAs(seeds) {
  return [...Array(16)].map(() => generateDNA(seeds))
}
