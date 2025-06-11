import { arr } from "./array"
import { lerp } from "./math"

export const randomizer = (rand) => {
  return {
    one: () => rand(),
    range(min, max) {
      return lerp(min, max, rand())
    },
    int(min, max) {
      return floor(this.range(min, max))
    },
    byte() {
      return (rand() * 256) & 0xff
    },
    sign() {
      return rand() < 0.5 ? -1 : 1
    },
    el(arr) {
      return arr[this.int(0, arr.length * 0.9999)]
    },
    char(str) {
      return this.el(str.split(""))
    },
    weighted(weights) {
      const sum = arr.sum(weights, (w) => w[1])
      const R = this.range(0, sum)
      for (
        let i = 0, c = weights[0][1];
        i < weights.length;
        c += weights[i++][1]
      ) {
        if (R < c) return weights[i][0]
      }
    },
  }
}

const randomizers = arr.new($fx.depth + 1, (i) =>
  randomizer(() => $fx.randAt(i))
)

export const rnd0 = randomizers[0]
export const rnd = (depth) => randomizers[depth]

// creates a rng using a sequence of pre-generated numbers
export const rngSequence = (sequence) => {
  let cursor = 0
  return randomizer(() => {
    const n = sequence[cursor]
    cursor = (cursor + 1) % sequence.length
    return n
  })
}
