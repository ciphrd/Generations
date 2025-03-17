import { arr } from "./array"
import { lerp } from "./math"

export const rnd = {
  range(min, max) {
    return lerp(min, max, $fx.rand())
  },
  int(min, max) {
    return floor(this.range(min, max))
  },
  sign() {
    return $fx.rand() < 0.5 ? -1 : 1
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
